import type {
  ConfirmSignUpInput,
  ConfirmSignUpOutput,
  ResendSignUpCodeInput,
  ResendSignUpCodeOutput,
  ResetPasswordInput,
  ResetPasswordOutput,
  SignInWithRedirectInput,
  SignUpInput,
  SignUpOutput,
} from '@aws-amplify/auth'
import { assign, fromPromise, setup } from 'xstate'
import { setCodeDeliveryDetails, setNextSignUpStep, setRemoteError, setUnverifiedUserAttributes } from '../actions'
import {
  hasCompletedSignIn,
  hasCompletedSignUp,
  isUserAlreadyConfirmed,
  shouldAutoSignIn,
  shouldConfirmSignInWithNewPassword,
  shouldConfirmSignUp,
  shouldConfirmSignUpFromSignIn,
  shouldResetPasswordFromSignIn,
  shouldVerifyAttribute,
} from '../guards'
import type { AuthEvent, Handlers, SignUpContext } from '../types'

type SignUpHandlers = Pick<
  Handlers,
  'autoSignIn' | 'confirmSignUp' | 'signInWithRedirect' | 'signUp' | 'resetPassword' | 'resendSignUpCode' | 'fetchUserAttributes'
>

/**
 * @internal
 */
export const signUpActor = (handlers: SignUpHandlers) => {
  return setup({
    types: {
      context: {} as SignUpContext,
      events: {} as AuthEvent,
    },
    guards: {
      hasCompletedSignIn: ({ event }) => hasCompletedSignIn(event),
      hasCompletedSignUp: ({ event }) => hasCompletedSignUp(event),
      isUserAlreadyConfirmed: ({ event }) => isUserAlreadyConfirmed(event),
      shouldAutoSignIn: ({ event }) => shouldAutoSignIn(event),
      shouldConfirmSignInWithNewPassword: ({ event }) => shouldConfirmSignInWithNewPassword(event),
      shouldConfirmSignUp: ({ context: { step } }) => shouldConfirmSignUp(step),
      shouldConfirmSignUpFromSignIn: ({ event }) => shouldConfirmSignUpFromSignIn(event),
      shouldResetPasswordFromSignIn: ({ event }) => shouldResetPasswordFromSignIn(event),
      shouldVerifyAttribute: ({ event }) => shouldVerifyAttribute(event),
    },
    actors: {
      autoSignIn: fromPromise(() => handlers.autoSignIn()),
      confirmSignUp: fromPromise<ConfirmSignUpOutput, ConfirmSignUpInput>(({ input }) => handlers.confirmSignUp(input)),
      fetchUserAttributes: fromPromise(() => handlers.fetchUserAttributes()),
      resetPassword: fromPromise<ResetPasswordOutput, ResetPasswordInput>(({ input }) => handlers.resetPassword(input)),
      resendSignUpCode: fromPromise<ResendSignUpCodeOutput, ResendSignUpCodeInput>(({ input }) => handlers.resendSignUpCode(input)),
      signUp: fromPromise<SignUpOutput, SignUpInput>(({ input }) => handlers.signUp(input)),
      signInWithRedirect: fromPromise<void, SignInWithRedirectInput>(({ input }) => handlers.signInWithRedirect(input)),
    },
    actions: {
      setShouldVerifyUserAttributeStep: assign({ unverifiedUserAttributes: setUnverifiedUserAttributes }),
      setConfirmAttributeCompleteStep: assign({ step: 'CONFIRM_ATTRIBUTE_COMPLETE' }),
      setCodeDeliveryDetails: assign({ codeDeliveryDetails: setCodeDeliveryDetails }),
      setRemoteError: assign({ remoteError: setRemoteError }),
      setNextSignUpStep: assign({ step: setNextSignUpStep }),
    },
  }).createMachine({
    id: 'signUpActor',
    initial: 'init',
    context: { step: 'SIGN_UP' },
    states: {
      init: {
        always: [{ guard: 'shouldConfirmSignUp', target: 'confirmSignUp' }, { target: '#signUpActor.signUp' }],
      },
      autoSignIn: {
        tags: 'pending',
        invoke: {
          src: 'autoSignIn',
          onDone: [
            { guard: 'hasCompletedSignIn', target: '#signUpActor.fetchUserAttributes' },
            { guard: 'shouldConfirmSignInWithNewPassword', target: '#signUpActor.resolved' },
            { guard: 'shouldResetPasswordFromSignIn', target: '#signUpActor.resetPassword' },
            { guard: 'shouldConfirmSignUpFromSignIn', target: '#signUpActor.resendSignUpCode' },
            { target: '#signUpActor.resolved' },
          ],
          onError: { target: '#signUpActor.resolved' },
        },
      },
      fetchUserAttributes: {
        invoke: {
          src: 'fetchUserAttributes',
          onDone: [
            {
              guard: 'shouldVerifyAttribute',
              actions: ['setShouldVerifyUserAttributeStep', 'setConfirmAttributeCompleteStep'],
              target: '#signUpActor.resolved',
            },
            { actions: 'setConfirmAttributeCompleteStep', target: '#signUpActor.resolved' },
          ],
          onError: { actions: 'setConfirmAttributeCompleteStep', target: '#signUpActor.resolved' },
        },
      },
      federatedSignIn: {
        invoke: {
          src: 'signInWithRedirect',
          input: ({ event }) => event.data as SignInWithRedirectInput,
          onDone: 'signUp',
          onError: { actions: 'setRemoteError', target: '#signUpActor.signUp' },
        },
      },
      resetPassword: {
        invoke: {
          src: 'resetPassword',
          input: ({ event }) => event.data as ResetPasswordInput,
          onDone: { actions: 'setCodeDeliveryDetails', target: '#signUpActor.resolved' },
          onError: { actions: 'setRemoteError' },
        },
      },
      resendSignUpCode: {
        tags: 'pending',
        invoke: {
          src: 'resendSignUpCode',
          input: ({ event }) => ({ username: event.data?.username ?? '' }),
          onDone: { actions: 'setCodeDeliveryDetails', target: '#signUpActor.confirmSignUp' },
          onError: [{ guard: 'isUserAlreadyConfirmed', target: '#signUpActor.resolved' }, { actions: 'setRemoteError' }],
        },
      },
      signUp: {
        tags: 'pending',
        initial: 'idle',
        on: {
          FEDERATED_SIGN_IN: { target: '#signUpActor.federatedSignIn' },
        },
        states: {
          idle: {
            on: {
              SUBMIT: { target: 'submit' },
            },
          },
          submit: {
            tags: 'pending',
            invoke: {
              src: 'signUp',
              input: ({ event }) => event.data as SignUpInput,
              onDone: [
                { guard: 'hasCompletedSignUp', actions: 'setNextSignUpStep', target: '#signUpActor.resolved' },
                { guard: 'shouldAutoSignIn', actions: 'setNextSignUpStep', target: '#signUpActor.autoSignIn' },
                { actions: ['setCodeDeliveryDetails', 'setNextSignUpStep'], target: '#signUpActor.init' },
              ],
              onError: { actions: 'setRemoteError', target: 'idle' },
            },
          },
        },
      },
      confirmSignUp: {
        initial: 'idle',
        states: {
          idle: {
            on: {
              SUBMIT: { target: 'submit' },
              RESEND: { target: '#signUpActor.resendSignUpCode' },
            },
          },
          submit: {
            tags: 'pending',
            invoke: {
              src: 'confirmSignUp',
              input: ({ event }) => event.data as ConfirmSignUpInput,
              onDone: [
                { guard: 'shouldAutoSignIn', actions: 'setNextSignUpStep', target: '#signUpActor.autoSignIn' },
                { actions: 'setNextSignUpStep', target: '#signUpActor.init' },
              ],
              onError: { actions: 'setRemoteError', target: 'idle' },
            },
          },
        },
      },
      resolved: { type: 'final' },
    },
    output: ({ context }) => context,
  })
}
