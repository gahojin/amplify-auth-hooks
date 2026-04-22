import {
  type ConfirmSignUpInput,
  type ConfirmSignUpOutput,
  listWebAuthnCredentials,
  type ResendSignUpCodeInput,
  type ResendSignUpCodeOutput,
  type ResetPasswordInput,
  type ResetPasswordOutput,
  type SignInWithRedirectInput,
  type SignUpInput,
  type SignUpOutput,
} from '@aws-amplify/auth'
import { assign, fromPromise, sendParent, setup } from 'xstate'
import {
  setAllowedMfaTypes,
  setCodeDeliveryDetails,
  setFetchedUserAttributes,
  setHasExistingPasskeys,
  setNextSignInStep,
  setNextSignUpStep,
  setRemoteError,
  setSelectedAuthMethod,
  setTotpSecretCode,
  setUnverifiedUserAttributes,
  setUsername,
} from '~/machines/actions.js'
import {
  hasCompletedSignIn,
  hasCompletedSignUp,
  hasPasskeyRegistrationPrompts,
  isUserAlreadyConfirmed,
  shouldAutoSignIn,
  shouldConfirmSignInWithNewPassword,
  shouldConfirmSignUpFromSignIn,
  shouldManualSignIn,
  shouldPromptPasskeyRegistrationAfterSignup,
  shouldResetPasswordFromSignIn,
  shouldVerifyAttribute,
} from '~/machines/guards.js'
import type { AuthEvent, Handlers, SignUpContext } from '~/types/machines.js'

type SignUpHandlers = Pick<
  Handlers,
  'autoSignIn' | 'confirmSignUp' | 'signInWithRedirect' | 'signUp' | 'resetPassword' | 'resendSignUpCode' | 'fetchUserAttributes'
>

/**
 * @internal
 */
export const signUpActor = (handlers: SignUpHandlers, overridesContext?: SignUpContext) => {
  return setup({
    types: {
      context: {} as SignUpContext,
      events: {} as AuthEvent,
    },
    guards: {
      hasCompletedSignIn: ({ event }) => hasCompletedSignIn(event),
      hasCompletedSignUp: ({ event }) => hasCompletedSignUp(event),
      hasPasskeyRegistrationPrompts: ({ context: { passwordless } }) => hasPasskeyRegistrationPrompts(passwordless),
      isUserAlreadyConfirmed: ({ event }) => isUserAlreadyConfirmed(event),
      shouldAutoSignIn: ({ event }) => shouldAutoSignIn(event),
      shouldManualSignIn: ({ context, event }) => shouldManualSignIn(context, event),
      shouldConfirmSignInWithNewPassword: ({ event }) => shouldConfirmSignInWithNewPassword(event),
      shouldConfirmSignUp: ({ context: { step } }) => step === 'CONFIRM_SIGN_UP',
      shouldConfirmSignUpFromSignIn: ({ event }) => shouldConfirmSignUpFromSignIn(event),
      shouldResetPasswordFromSignIn: ({ event }) => shouldResetPasswordFromSignIn(event),
      shouldVerifyAttribute: ({ event }) => shouldVerifyAttribute(event),
      shouldPromptPasskeyRegistrationAfterSignup: ({ context }) => shouldPromptPasskeyRegistrationAfterSignup(context),
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
      sendUpdate: sendParent({ type: 'CHILD_CHANGED' }),
      setShouldVerifyUserAttributeStep: assign({ step: 'SHOULD_CONFIRM_USER_ATTRIBUTE', unverifiedUserAttributes: setUnverifiedUserAttributes }),
      setConfirmAttributeCompleteStep: assign({ step: 'CONFIRM_ATTRIBUTE_COMPLETE' }),
      setSignInStep: assign({ step: 'SIGN_IN' }),
      setNextSignUpStep: assign({ step: setNextSignUpStep }),
      setNextSignInStep: assign({ step: setNextSignInStep }),
      setSelectedAuthMethod: assign({ selectedAuthMethod: setSelectedAuthMethod }),
      setFetchedUserAttributes: assign({ fetchedUserAttributes: setFetchedUserAttributes }),
      setHasExistingPasskeys: assign({ hasExistingPasskeys: setHasExistingPasskeys }),
      clearHasExistingPasskeys: assign({ hasExistingPasskeys: false }),
      setCodeDeliveryDetails: assign({ codeDeliveryDetails: setCodeDeliveryDetails }),
      setTotpSecretCode: assign({ totpSecretCode: setTotpSecretCode }),
      setAllowedMfaTypes: assign({ allowedMfaTypes: setAllowedMfaTypes }),
      setUsername: assign({ username: setUsername }),
      setRemoteError: assign({ remoteError: setRemoteError }),
      clearError: assign({ remoteError: undefined }),
    },
  }).createMachine({
    id: 'signUpActor',
    initial: 'init',
    context: ({ input }) => ({ step: 'SIGN_UP', ...overridesContext, ...input }),
    states: {
      init: {
        always: [{ guard: 'shouldConfirmSignUp', target: 'confirmSignUp' }, { target: '#signUpActor.signUp' }],
      },
      autoSignIn: {
        tags: 'pending',
        invoke: {
          src: 'autoSignIn',
          onDone: [
            { guard: 'hasCompletedSignIn', actions: 'setNextSignInStep', target: '#signUpActor.fetchUserAttributes' },
            { guard: 'shouldConfirmSignInWithNewPassword', actions: 'setNextSignInStep', target: '#signUpActor.resolved' },
            { guard: 'shouldResetPasswordFromSignIn', actions: 'setNextSignInStep', target: '#signUpActor.resetPassword' },
            { guard: 'shouldConfirmSignUpFromSignIn', actions: 'setNextSignInStep', target: '#signUpActor.resendSignUpCode' },
            { actions: ['setNextSignInStep', 'setTotpSecretCode', 'setAllowedMfaTypes'], target: '#signUpActor.resolved' },
          ],
          onError: { actions: ['setRemoteError', 'sendUpdate'], target: '#signUpActor.resolved' },
        },
      },
      fetchUserAttributes: {
        invoke: {
          src: 'fetchUserAttributes',
          onDone: [
            {
              guard: 'hasPasskeyRegistrationPrompts',
              actions: 'setFetchedUserAttributes',
              target: '#signUpActor.checkPasskeys',
            },
            { actions: 'setFetchedUserAttributes', target: '#signUpActor.evaluatePasskeyPrompt' },
          ],
          onError: { actions: 'setConfirmAttributeCompleteStep', target: '#signUpActor.resolved' },
        },
      },
      checkPasskeys: {
        invoke: {
          src: fromPromise(async () => {
            try {
              const result = await listWebAuthnCredentials()
              return result.credentials && result.credentials.length > 0
            } catch {
              return false
            }
          }),
          onDone: { actions: 'setHasExistingPasskeys', target: '#signUpActor.evaluatePasskeyPrompt' },
          onError: { actions: 'clearHasExistingPasskeys', target: '#signUpActor.evaluatePasskeyPrompt' },
        },
      },
      evaluatePasskeyPrompt: {
        always: [
          {
            guard: 'shouldPromptPasskeyRegistrationAfterSignup',
            target: '#signUpActor.passkeyPrompt',
          },
          {
            guard: 'shouldVerifyAttribute',
            actions: ['setShouldVerifyUserAttributeStep'],
            target: '#signUpActor.resolved',
          },
          {
            actions: 'setConfirmAttributeCompleteStep',
            target: '#signUpActor.resolved',
          },
        ],
      },
      federatedSignIn: {
        entry: ['clearError', 'sendUpdate'],
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
          onError: { actions: ['setRemoteError', 'sendUpdate'] },
        },
      },
      resendSignUpCode: {
        tags: 'pending',
        entry: 'sendUpdate',
        exit: 'sendUpdate',
        invoke: {
          src: 'resendSignUpCode',
          input: ({ context: { username }, event }) => ({ username, ...event.data }) as ResendSignUpCodeInput,
          onDone: { actions: 'setCodeDeliveryDetails', target: '#signUpActor.confirmSignUp' },
          onError: [
            { guard: 'isUserAlreadyConfirmed', target: '#signUpActor.resolved' },
            { actions: 'setRemoteError', target: '#signUpActor.confirmSignUp' },
          ],
        },
      },
      signUp: {
        initial: 'idle',
        exit: 'clearError',
        on: {
          FEDERATED_SIGN_IN: { target: '#signUpActor.federatedSignIn' },
        },
        states: {
          idle: {
            entry: 'sendUpdate',
            on: {
              SUBMIT: { target: 'submit' },
            },
          },
          submit: {
            tags: 'pending',
            entry: ['sendUpdate', 'setSelectedAuthMethod', 'setUsername', 'clearError'],
            exit: 'sendUpdate',
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
        exit: 'clearError',
        states: {
          idle: {
            entry: 'sendUpdate',
            on: {
              SUBMIT: { target: 'submit' },
              RESEND: { target: '#signUpActor.resendSignUpCode' },
            },
          },
          submit: {
            tags: 'pending',
            entry: ['clearError', 'sendUpdate'],
            invoke: {
              src: 'confirmSignUp',
              input: ({ context: { username }, event }) => ({ username, ...event.data }) as ConfirmSignUpInput,
              onDone: [
                { guard: 'shouldAutoSignIn', actions: 'setNextSignUpStep', target: '#signUpActor.autoSignIn' },
                { guard: 'shouldManualSignIn', actions: 'setSignInStep', target: '#signUpActor.resolved' },
                { actions: 'setNextSignUpStep', target: '#signUpActor.init' },
              ],
              onError: { actions: ['setRemoteError', 'sendUpdate'], target: 'idle' },
            },
          },
        },
      },
      passkeyPrompt: {
        entry: 'sendUpdate',
        on: {
          SUBMIT: { target: '#signUpActor.resolved' },
        },
      },
      resolved: { type: 'final' },
    },
    output: ({ context }) => context,
  })
}
