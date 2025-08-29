import type {
  ConfirmSignInInput,
  ConfirmSignInOutput,
  ResendSignUpCodeInput,
  ResendSignUpCodeOutput,
  ResetPasswordInput,
  ResetPasswordOutput,
  SignInInput,
  SignInOutput,
  SignInWithRedirectInput,
} from '@aws-amplify/auth'
import { assign, fromPromise, sendParent, setup } from 'xstate'
import {
  setAllowedMfaTypes,
  setCodeDeliveryDetails,
  setConfirmSignUpStep,
  setNextSignInStep,
  setRemoteError,
  setShouldVerifyUserAttributeStep,
  setTotpSecretCode,
  setUnverifiedUserAttributes,
  setUsername,
} from '../actions'
import {
  hasCompletedSignIn,
  isShouldConfirmSignInWithNewPassword,
  shouldConfirmSignIn,
  shouldConfirmSignInWithNewPassword,
  shouldConfirmSignUpFromSignIn,
  shouldResetPasswordFromSignIn,
  shouldSelectMfaType,
  shouldSetupEmail,
  shouldSetupTotp,
  shouldVerifyAttribute,
} from '../guards'
import type { AuthEvent, Handlers, SignInContext } from '../types'

type SignInHandlers = Pick<Handlers, 'confirmSignIn' | 'fetchUserAttributes' | 'resetPassword' | 'signIn' | 'signInWithRedirect' | 'resendSignUpCode'>

/**
 * @internal
 */
export const signInActor = (handlers: SignInHandlers, overridesContext?: SignInContext) => {
  return setup({
    types: {
      context: {} as SignInContext,
      events: {} as AuthEvent,
    },
    guards: {
      shouldConfirmSignIn: ({ context: { step } }) => shouldConfirmSignIn(step),
      shouldSetupTotp: ({ context: { step } }) => shouldSetupTotp(step),
      shouldSetupEmail: ({ context: { step } }) => shouldSetupEmail(step),
      shouldSelectMfaType: ({ context: { step } }) => shouldSelectMfaType(step),
      shouldVerifyAttribute: ({ event }) => shouldVerifyAttribute(event),
      shouldConfirmSignInWithNewPassword: ({ event }) => shouldConfirmSignInWithNewPassword(event),
      shouldResetPasswordFromSignIn: ({ event }) => shouldResetPasswordFromSignIn(event),
      shouldConfirmSignUpFromSignIn: ({ event }) => shouldConfirmSignUpFromSignIn(event),
      hasCompletedSignIn: ({ event }) => hasCompletedSignIn(event),
      isShouldConfirmSignInWithNewPassword: ({ context: { step } }) => isShouldConfirmSignInWithNewPassword(step),
    },
    actors: {
      fetchUserAttributes: fromPromise(() => handlers.fetchUserAttributes()),
      resetPassword: fromPromise<ResetPasswordOutput, ResetPasswordInput>(({ input }) => handlers.resetPassword(input)),
      resendSignUpCode: fromPromise<ResendSignUpCodeOutput, ResendSignUpCodeInput>(({ input }) => handlers.resendSignUpCode(input)),
      signIn: fromPromise<SignInOutput, SignInInput>(({ input }) => handlers.signIn(input)),
      confirmSignIn: fromPromise<ConfirmSignInOutput, ConfirmSignInInput>(({ input }) => handlers.confirmSignIn(input)),
      signInWithRedirect: fromPromise<void, SignInWithRedirectInput>(({ input }) => handlers.signInWithRedirect(input)),
    },
    actions: {
      sendUpdate: sendParent({ type: 'CHILD_CHANGED' }),
      setShouldVerifyUserAttributeStep: assign({ step: setShouldVerifyUserAttributeStep }),
      setUnverifiedUserAttributes: assign({ unverifiedUserAttributes: setUnverifiedUserAttributes }),
      setCodeDeliveryDetails: assign({ codeDeliveryDetails: setCodeDeliveryDetails }),
      setConfirmAttributeCompleteStep: assign({ step: 'CONFIRM_ATTRIBUTE_COMPLETE' }),
      setTotpSecretCode: assign({ totpSecretCode: setTotpSecretCode }),
      setAllowedMfaTypes: assign({ allowedMfaTypes: setAllowedMfaTypes }),
      setNextSignInStep: assign({ step: setNextSignInStep }),
      setConfirmSignUpStep: assign({ step: setConfirmSignUpStep }),
      setActorDoneData: assign(({ event }) => {
        const output = event?.output ?? {}
        return {
          codeDeliveryDetails: output.codeDeliveryDetails,
          missingAttributes: output.missingAttributes,
          remoteError: output.remoteError,
          username: output.username,
          step: output.step,
          totpSecretCode: output.totpSecretCode,
          unverifiedUserAttributes: output.unverifiedUserAttributes,
          allowedMfaTypes: output.allowedMfaTypes,
        }
      }),
      setUsername: assign({ username: setUsername }),
      setRemoteError: assign({ remoteError: setRemoteError }),
      clearError: assign({ remoteError: undefined }),
    },
  }).createMachine({
    id: 'signInActor',
    context: ({ input }) => ({ step: 'SIGN_IN', ...overridesContext, ...input }),
    initial: 'init',
    states: {
      init: {
        always: [
          { guard: 'shouldConfirmSignIn', target: '#signInActor.confirmSignIn' },
          { guard: 'shouldSetupTotp', target: '#signInActor.setupTotp' },
          { guard: 'shouldSetupEmail', target: '#signInActor.setupEmail' },
          { guard: 'shouldSelectMfaType', target: '#signInActor.selectMfaType' },
          { guard: 'isShouldConfirmSignInWithNewPassword', actions: 'setActorDoneData', target: '#signInActor.forceChangePassword' },
          { target: '#signInActor.signIn' },
        ],
      },
      federatedSignIn: {
        entry: ['sendUpdate', 'clearError'],
        invoke: {
          src: 'signInWithRedirect',
          input: ({ event }) => event.data as SignInWithRedirectInput,
          onDone: { target: '#signInActor.signIn' },
          onError: { actions: 'setRemoteError', target: '#signInActor.signIn' },
        },
      },
      fetchUserAttributes: {
        invoke: {
          src: 'fetchUserAttributes',
          onDone: [
            {
              guard: 'shouldVerifyAttribute',
              actions: ['setShouldVerifyUserAttributeStep', 'setUnverifiedUserAttributes'],
              target: '#signInActor.resolved',
            },
            { actions: 'setConfirmAttributeCompleteStep', target: '#signInActor.resolved' },
          ],
          onError: { actions: 'setConfirmAttributeCompleteStep', target: '#signInActor.resolved' },
        },
      },
      resendSignUpCode: {
        tags: 'pending',
        invoke: {
          src: 'resendSignUpCode',
          input: ({ context: { username }, event }) => ({ username, ...event.data }) as ResendSignUpCodeInput,
          onDone: { actions: 'setCodeDeliveryDetails', target: '#signInActor.resolved' },
          onError: { actions: 'setRemoteError', target: '#signInActor.signIn' },
        },
      },
      resetPassword: {
        invoke: {
          src: 'resetPassword',
          input: ({ context: { username }, event }) => ({ username, ...event.data }) as ResetPasswordInput,
          onDone: { actions: 'setCodeDeliveryDetails', target: '#signInActor.resolved' },
          onError: { actions: ['setRemoteError', 'sendUpdate'] },
        },
      },
      signIn: {
        initial: 'idle',
        states: {
          idle: {
            entry: 'sendUpdate',
            on: {
              FEDERATED_SIGN_IN: { target: '#signInActor.federatedSignIn' },
              SUBMIT: { target: 'submit' },
            },
          },
          submit: {
            tags: 'pending',
            entry: ['sendUpdate', 'setUsername', 'clearError'],
            invoke: {
              src: 'signIn',
              input: ({ event }) => event.data as SignInInput,
              onDone: [
                { guard: 'hasCompletedSignIn', actions: 'setNextSignInStep', target: '#signInActor.fetchUserAttributes' },
                { guard: 'shouldConfirmSignInWithNewPassword', actions: 'setNextSignInStep', target: '#signInActor.forceChangePassword' },
                { guard: 'shouldResetPasswordFromSignIn', actions: 'setNextSignInStep', target: '#signInActor.resetPassword' },
                { guard: 'shouldConfirmSignUpFromSignIn', actions: 'setNextSignInStep', target: '#signInActor.resendSignUpCode' },
                { actions: ['setNextSignInStep', 'setTotpSecretCode', 'setAllowedMfaTypes'], target: '#signInActor.init' },
              ],
              onError: [
                { guard: 'shouldConfirmSignUpFromSignIn', actions: 'setConfirmSignUpStep', target: '#signInActor.resendSignUpCode' },
                { actions: 'setRemoteError', target: 'idle' },
              ],
            },
          },
        },
      },
      confirmSignIn: {
        initial: 'idle',
        exit: 'clearError',
        states: {
          idle: {
            entry: 'sendUpdate',
            on: {
              SUBMIT: { target: 'submit' },
              SIGN_IN: { target: '#signInActor.signIn' },
            },
          },
          submit: {
            tags: 'pending',
            entry: ['sendUpdate', 'clearError'],
            invoke: {
              src: 'confirmSignIn',
              input: ({ event }) => event.data as ConfirmSignInInput,
              onDone: [
                { guard: 'hasCompletedSignIn', actions: 'setNextSignInStep', target: '#signInActor.fetchUserAttributes' },
                { guard: 'shouldConfirmSignInWithNewPassword', actions: 'setNextSignInStep', target: '#signInActor.forceChangePassword' },
                { guard: 'shouldResetPasswordFromSignIn', actions: 'setNextSignInStep', target: '#signInActor.resetPassword' },
                { guard: 'shouldConfirmSignUpFromSignIn', actions: 'setNextSignInStep', target: '#signInActor.resendSignUpCode' },
                { actions: ['setNextSignInStep', 'setTotpSecretCode', 'setAllowedMfaTypes'], target: '#signInActor.init' },
              ],
              onError: { actions: 'setRemoteError', target: 'idle' },
            },
          },
        },
      },
      forceChangePassword: {
        initial: 'idle',
        entry: 'clearError',
        exit: 'clearError',
        states: {
          idle: {
            entry: 'sendUpdate',
            on: { SUBMIT: { target: 'submit' } },
          },
          submit: {
            tags: 'pending',
            entry: ['sendUpdate', 'clearError'],
            invoke: {
              src: 'confirmSignIn',
              input: ({ event }) => event.data as ConfirmSignInInput,
              onDone: [
                { guard: 'hasCompletedSignIn', actions: 'setNextSignInStep', target: '#signInActor.fetchUserAttributes' },
                { guard: 'shouldConfirmSignInWithNewPassword', actions: 'setNextSignInStep', target: '#signInActor.forceChangePassword' },
                { guard: 'shouldResetPasswordFromSignIn', actions: 'setNextSignInStep', target: '#signInActor.resetPassword' },
                { guard: 'shouldConfirmSignUpFromSignIn', actions: 'setNextSignInStep', target: '#signInActor.resendSignUpCode' },
                { actions: ['setNextSignInStep', 'setTotpSecretCode', 'setAllowedMfaTypes'], target: '#signInActor.init' },
              ],
              onError: { actions: 'setRemoteError', target: 'idle' },
            },
          },
        },
      },
      setupTotp: {
        initial: 'idle',
        exit: 'clearError',
        states: {
          idle: {
            entry: 'sendUpdate',
            on: {
              SUBMIT: { target: 'submit' },
              SIGN_IN: { target: '#signInActor.signIn' },
            },
          },
          submit: {
            tags: 'pending',
            entry: ['sendUpdate', 'clearError'],
            invoke: {
              src: 'confirmSignIn',
              input: ({ event }) => event.data as ConfirmSignInInput,
              onDone: [
                { guard: 'hasCompletedSignIn', actions: 'setNextSignInStep', target: '#signInActor.fetchUserAttributes' },
                { guard: 'shouldConfirmSignInWithNewPassword', actions: 'setNextSignInStep', target: '#signInActor.forceChangePassword' },
                { guard: 'shouldResetPasswordFromSignIn', actions: 'setNextSignInStep', target: '#signInActor.resetPassword' },
                { guard: 'shouldConfirmSignUpFromSignIn', actions: 'setNextSignInStep', target: '#signInActor.resendSignUpCode' },
                { actions: ['setNextSignInStep', 'setTotpSecretCode', 'setAllowedMfaTypes'], target: '#signInActor.init' },
              ],
              onError: { actions: 'setRemoteError', target: 'idle' },
            },
          },
        },
      },
      setupEmail: {
        initial: 'idle',
        exit: 'clearError',
        states: {
          idle: {
            entry: 'sendUpdate',
            on: {
              SUBMIT: { target: 'submit' },
              SIGN_IN: { target: '#signInActor.signIn' },
            },
          },
          submit: {
            tags: 'pending',
            entry: ['sendUpdate', 'clearError'],
            invoke: {
              src: 'confirmSignIn',
              input: ({ event }) => event.data as ConfirmSignInInput,
              onDone: [
                { guard: 'hasCompletedSignIn', actions: 'setNextSignInStep', target: '#signInActor.fetchUserAttributes' },
                { guard: 'shouldConfirmSignInWithNewPassword', actions: 'setNextSignInStep', target: '#signInActor.forceChangePassword' },
                { guard: 'shouldResetPasswordFromSignIn', actions: 'setNextSignInStep', target: '#signInActor.resetPassword' },
                { guard: 'shouldConfirmSignUpFromSignIn', actions: 'setNextSignInStep', target: '#signInActor.resendSignUpCode' },
                { actions: ['setNextSignInStep', 'setTotpSecretCode', 'setAllowedMfaTypes'], target: '#signInActor.init' },
              ],
              onError: { actions: 'setRemoteError', target: 'idle' },
            },
          },
        },
      },
      selectMfaType: {
        initial: 'idle',
        exit: 'clearError',
        states: {
          idle: {
            entry: 'sendUpdate',
            on: {
              SUBMIT: { target: 'submit' },
              SIGN_IN: { target: '#signInActor.signIn' },
            },
          },
          submit: {
            tags: 'pending',
            entry: ['sendUpdate', 'clearError'],
            invoke: {
              src: 'confirmSignIn',
              input: ({ event }) => event.data as ConfirmSignInInput,
              onDone: [
                { guard: 'hasCompletedSignIn', actions: 'setNextSignInStep', target: '#signInActor.fetchUserAttributes' },
                { guard: 'shouldConfirmSignInWithNewPassword', actions: 'setNextSignInStep', target: '#signInActor.forceChangePassword' },
                { guard: 'shouldResetPasswordFromSignIn', actions: 'setNextSignInStep', target: '#signInActor.resetPassword' },
                { guard: 'shouldConfirmSignUpFromSignIn', actions: 'setNextSignInStep', target: '#signInActor.resendSignUpCode' },
                { actions: ['setNextSignInStep', 'setTotpSecretCode', 'setAllowedMfaTypes'], target: '#signInActor.init' },
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
