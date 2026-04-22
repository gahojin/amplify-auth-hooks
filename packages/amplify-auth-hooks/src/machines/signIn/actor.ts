import {
  type ConfirmSignInInput,
  type ConfirmSignInOutput,
  listWebAuthnCredentials,
  type ResendSignUpCodeInput,
  type ResendSignUpCodeOutput,
  type ResetPasswordInput,
  type ResetPasswordOutput,
  type SignInInput,
  type SignInOutput,
  type SignInWithRedirectInput,
} from '@aws-amplify/auth'
import { assign, fromPromise, sendParent, setup } from 'xstate'
import {
  setAllowedMfaTypes,
  setCodeDeliveryDetails,
  setFetchedUserAttributes,
  setHasExistingPasskeys,
  setNextSignInStep,
  setRemoteError,
  setSelectedAuthMethod,
  setSignInActorDoneData,
  setTotpSecretCode,
  setUnverifiedUserAttributes,
  setUsername,
} from '~/machines/actions'
import {
  hasCompletedSignIn,
  hasPasskeyRegistrationPrompts,
  isShouldConfirmSignInWithNewPassword,
  shouldConfirmSignIn,
  shouldConfirmSignInWithNewPassword,
  shouldConfirmSignUpFromSignIn,
  shouldPromptPasskeyRegistration,
  shouldResetPasswordFromSignIn,
  shouldReturnToSelectMethod,
  shouldSelectMfaType,
  shouldSetupEmail,
  shouldSetupTotp,
  shouldVerifyAttribute,
} from '~/machines/guards'
import type { AuthEvent, Handlers, SignInContext } from '~/types/machines'

type SignInHandlers = Pick<Handlers, 'confirmSignIn' | 'fetchUserAttributes' | 'resetPassword' | 'signIn' | 'signInWithRedirect' | 'resendSignUpCode'>

/**
 * @internal
 */
export const signInActor = (handlers: SignInHandlers, overridesContext?: SignInContext) => {
  const machineSetup = setup({
    types: {
      context: {} as SignInContext,
      events: {} as AuthEvent,
    },
    guards: {
      hasCompletedSignIn: ({ event }) => hasCompletedSignIn(event),
      hasPasskeyRegistrationPrompts: ({ context: { passwordless } }) => hasPasskeyRegistrationPrompts(passwordless),
      isShouldConfirmSignInWithNewPassword: ({ context: { step } }) => isShouldConfirmSignInWithNewPassword(step),
      shouldConfirmSignIn: ({ context: { step } }) => shouldConfirmSignIn(step),
      shouldSetupTotp: ({ context: { step } }) => shouldSetupTotp(step),
      shouldSetupEmail: ({ context: { step } }) => shouldSetupEmail(step),
      shouldSelectMfaType: ({ context: { step } }) => shouldSelectMfaType(step),
      shouldVerifyAttribute: ({ event }) => shouldVerifyAttribute(event),
      shouldConfirmSignInWithNewPassword: ({ event }) => shouldConfirmSignInWithNewPassword(event),
      shouldResetPasswordFromSignIn: ({ event }) => shouldResetPasswordFromSignIn(event),
      shouldConfirmSignUpFromSignIn: ({ event }) => shouldConfirmSignUpFromSignIn(event),
      shouldPromptPasskeyRegistration: ({ context }) => shouldPromptPasskeyRegistration(context),
      shouldReturnToSelectMethod: ({ context }) => shouldReturnToSelectMethod(context),
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
      setShouldVerifyUserAttributeStep: assign({ step: 'SHOULD_CONFIRM_USER_ATTRIBUTE', unverifiedUserAttributes: setUnverifiedUserAttributes }),
      setConfirmAttributeCompleteStep: assign({ step: 'CONFIRM_ATTRIBUTE_COMPLETE' }),
      setConfirmSignUpStep: assign({ step: 'CONFIRM_SIGN_UP' }),
      setSelectAuthMethodStep: assign({ step: 'SELECT_AUTH_METHOD' }),
      setNextSignInStep: assign({ step: setNextSignInStep }),
      setCodeDeliveryDetails: assign({ codeDeliveryDetails: setCodeDeliveryDetails }),
      setFetchedUserAttributes: assign({ fetchedUserAttributes: setFetchedUserAttributes }),
      setTotpSecretCode: assign({ totpSecretCode: setTotpSecretCode }),
      setAllowedMfaTypes: assign({ allowedMfaTypes: setAllowedMfaTypes }),
      setSelectedAuthMethod: assign({ selectedAuthMethod: setSelectedAuthMethod }),
      setHasExistingPasskeys: assign({ hasExistingPasskeys: setHasExistingPasskeys }),
      clearHasExistingPasskeys: assign({ hasExistingPasskeys: false }),
      setActorDoneData: assign(setSignInActorDoneData),
      setUsername: assign({ username: setUsername }),
      setRemoteError: assign({ remoteError: setRemoteError }),
      clearError: assign({ remoteError: undefined }),
    },
  })

  const handleSignInResponse = machineSetup.createStateConfig({
    onDone: [
      { guard: 'hasCompletedSignIn', actions: 'setNextSignInStep', target: '#signInActor.fetchUserAttributes' },
      { guard: 'shouldConfirmSignInWithNewPassword', actions: 'setNextSignInStep', target: '#signInActor.forceChangePassword' },
      { guard: 'shouldResetPasswordFromSignIn', actions: 'setNextSignInStep', target: '#signInActor.resetPassword' },
      { guard: 'shouldConfirmSignUpFromSignIn', actions: 'setNextSignInStep', target: '#signInActor.resendSignUpCode' },
      { actions: ['setNextSignInStep', 'setTotpSecretCode', 'setAllowedMfaTypes', 'setCodeDeliveryDetails'], target: '#signInActor.init' },
    ],
  })
  const confirmSignInState = machineSetup.createStateConfig({
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
          ...handleSignInResponse,
          onError: { actions: 'setRemoteError', target: 'idle' },
        },
      },
    },
  })

  return machineSetup.createMachine({
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
            { guard: 'hasPasskeyRegistrationPrompts', actions: 'setFetchedUserAttributes', target: '#signInActor.checkPasskeys' },
            { actions: 'setFetchedUserAttributes', target: '#signInActor.evaluatePasskeyPrompt' },
          ],
          onError: { actions: 'setConfirmAttributeCompleteStep', target: '#signInActor.resolved' },
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
          onDone: [
            { actions: 'setHasExistingPasskeys', target: '#signInActor.evaluatePasskeyPrompt' },
            { actions: 'setFetchedUserAttributes', target: '#signInActor.evaluatePasskeyPrompt' },
          ],
          onError: { actions: 'clearHasExistingPasskeys', target: '#signInActor.evaluatePasskeyPrompt' },
        },
      },
      evaluatePasskeyPrompt: {
        always: [
          { guard: 'shouldPromptPasskeyRegistration', target: '#signInActor.passkeyPrompt' },
          {
            guard: 'shouldVerifyAttribute',
            actions: 'setShouldVerifyUserAttributeStep',
            target: '#signInActor.resolved',
          },
          { actions: 'setConfirmAttributeCompleteStep', target: '#signInActor.resolved' },
        ],
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
              SUBMIT: [{ target: 'submit' }],
              SHOW_AUTH_METHODS: { actions: 'setUsername', target: 'selectMethod' },
            },
          },
          selectMethod: {
            entry: ['sendUpdate', 'setSelectAuthMethodStep', 'setUsername'],
            on: {
              SUBMIT: { actions: 'setSelectedAuthMethod', target: 'submit' },
              SIGN_IN: { target: 'idle' },
            },
          },
          submit: {
            tags: 'pending',
            entry: ['sendUpdate', 'setUsername', 'clearError'],
            invoke: {
              src: 'signIn',
              input: ({ event }) => event.data as SignInInput,
              ...handleSignInResponse,
              onError: [
                { guard: 'shouldReturnToSelectMethod', actions: 'setRemoteError', target: 'selectMethod' },
                { guard: 'shouldConfirmSignUpFromSignIn', actions: 'setConfirmSignUpStep', target: '#signInActor.resendSignUpCode' },
                { actions: 'setRemoteError', target: 'idle' },
              ],
            },
          },
        },
      },
      confirmSignIn: confirmSignInState,
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
              ...handleSignInResponse,
              onError: { actions: 'setRemoteError', target: 'idle' },
            },
          },
        },
      },
      setupTotp: confirmSignInState,
      setupEmail: confirmSignInState,
      selectMfaType: confirmSignInState,
      passkeyPrompt: {
        entry: 'sendUpdate',
        on: {
          SUBMIT: { actions: 'setConfirmAttributeCompleteStep', target: '#signInActor.resolved' },
        },
      },
      resolved: { type: 'final' },
    },
    output: ({ context }) => context,
  })
}
