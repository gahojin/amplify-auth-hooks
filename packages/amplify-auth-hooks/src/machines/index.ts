import type { AuthUser } from '@aws-amplify/auth'
import { assign, forwardTo, fromPromise, setup } from 'xstate'
import type { AuthMachineHubHandlerOptions } from '../authenticator/types'
import { signInActor } from '../machines/signIn/actor'
import { defaultHandlers } from './defaultHandlers'
import { forgotPasswordActor } from './forgotPassword/actor'
import {
  hasCompletedAttributeConfirmation,
  isConfirmSignUpStep,
  isConfirmUserAttributeStep,
  isResetPasswordStep,
  isShouldConfirmUserAttributeStep,
} from './guards'
import { signOutActor } from './signOut/actor'
import { signUpActor } from './signUp/actor'
import type { ActorDoneData, AuthContext, AuthEvent, Handlers } from './types'
import { verifyUserAttributesActor } from './verifyUserAttributes/actor'

export type AuthenticatorMachineOptions = AuthContext['config'] & {
  handlers?: Partial<Handlers>
} & AuthMachineHubHandlerOptions

/**
 * @internal
 */
export const createAuthenticatorMachine = (options?: AuthenticatorMachineOptions) => {
  const { handlers: customHandlers, ...config } = options ?? {}
  const handlers = { ...defaultHandlers, ...customHandlers }

  return setup({
    types: {
      context: {} as AuthContext,
      events: {} as AuthEvent,
    },
    guards: {
      hasCompletedAttributeConfirmation: ({ event: { output } }) => hasCompletedAttributeConfirmation(output?.step),
      hasUser: ({ context }) => !!context.user,
      isInitialStateSignUp: ({ context }) => context.config?.initialState === 'signUp',
      isInitialStateResetPassword: ({ context }) => context.config?.initialState === 'forgotPassword',
      isConfirmSignUpStep: ({ event: { output } }) => isConfirmSignUpStep(output?.step),
      isConfirmUserAttributeStep: ({ event: { output } }) => isConfirmUserAttributeStep(output?.step),
      isShouldConfirmUserAttributeStep: ({ event: { output } }) => isShouldConfirmUserAttributeStep(output?.step),
      isResetPasswordStep: ({ event: { output } }) => isResetPasswordStep(output?.step),
    },
    actors: {
      getCurrentUser: fromPromise(() => handlers.getCurrentUser()),
      invokeSignInActor: signInActor(handlers),
      invokeSignUpActor: signUpActor(handlers),
      invokeForgotPasswordActor: forgotPasswordActor(handlers),
      invokeVerifyUserAttributesActor: verifyUserAttributesActor(handlers),
      invokeSignOutActor: signOutActor(handlers),
    },
    actions: {
      clearActorDoneData: assign({ actorDoneData: undefined }),
      clearUser: assign({ user: undefined }),
      forwardToActor: forwardTo('childActor'),
      setUser: assign({ user: ({ event }) => event.output as AuthUser }),
      setActorDoneData: assign({ actorDoneData: ({ event }) => event.output as ActorDoneData }),
    },
  }).createMachine({
    id: 'authenticator',
    initial: 'idle',
    context: {
      config,
      user: undefined,
    },
    states: {
      idle: {
        invoke: {
          src: 'getCurrentUser',
          onDone: { actions: 'setUser', target: '#authenticator.setup' },
          onError: { target: '#authenticator.setup' },
        },
      },
      setup: {
        initial: 'init',
        states: {
          init: {
            always: [
              { guard: 'hasUser', target: '#authenticator.authenticated' },
              { guard: 'isInitialStateSignUp', target: '#authenticator.signUpActor' },
              { guard: 'isInitialStateResetPassword', target: '#authenticator.forgotPasswordActor' },
              { target: '#authenticator.signInActor' },
            ],
          },
        },
      },
      getCurrentUser: {
        invoke: {
          src: 'getCurrentUser',
          onDone: { actions: 'setUser', target: '#authenticator.authenticated' },
          onError: { target: 'setup' },
        },
      },
      signInActor: {
        invoke: {
          id: 'childActor',
          src: 'invokeSignInActor',
          input: ({ context }) => context.actorDoneData,
          onDone: [
            { guard: 'hasCompletedAttributeConfirmation', target: '#authenticator.getCurrentUser' },
            { guard: 'isShouldConfirmUserAttributeStep', actions: 'setActorDoneData', target: '#authenticator.verifyUserAttributesActor' },
            { guard: 'isResetPasswordStep', actions: 'setActorDoneData', target: '#authenticator.forgotPasswordActor' },
            { guard: 'isConfirmSignUpStep', actions: 'setActorDoneData', target: '#authenticator.signUpActor' },
          ],
        },
        entry: 'clearActorDoneData',
        on: {
          FORGOT_PASSWORD: { target: '#authenticator.forgotPasswordActor' },
          SIGN_UP: { target: '#authenticator.signUpActor' },
          SIGN_IN: { actions: 'forwardToActor' },
          FEDERATED_SIGN_IN: { actions: 'forwardToActor' },
          SUBMIT: { actions: 'forwardToActor' },
        },
      },
      signUpActor: {
        invoke: {
          id: 'childActor',
          src: 'invokeSignUpActor',
          input: ({ context }) => context.actorDoneData,
          onDone: [
            { guard: 'hasCompletedAttributeConfirmation', actions: 'clearActorDoneData', target: '#authenticator.getCurrentUser' },
            { guard: 'isShouldConfirmUserAttributeStep', actions: 'setActorDoneData', target: '#authenticator.verifyUserAttributesActor' },
            { guard: 'isConfirmUserAttributeStep', actions: 'clearActorDoneData', target: '#authenticator.verifyUserAttributesActor' },
            { actions: 'setActorDoneData', target: '#authenticator.signInActor' },
          ],
        },
        on: {
          SIGN_IN: { target: '#authenticator.signInActor' },
          FEDERATED_SIGN_IN: { actions: 'forwardToActor' },
          RESEND: { actions: 'forwardToActor' },
          SUBMIT: { actions: 'forwardToActor' },
        },
      },
      forgotPasswordActor: {
        invoke: {
          id: 'childActor',
          src: 'invokeForgotPasswordActor',
          input: ({ context }) => context.actorDoneData,
          onDone: { target: '#authenticator.signInActor' },
        },
        exit: 'clearActorDoneData',
        on: {
          SIGN_IN: { target: '#authenticator.signInActor' },
          RESEND: { actions: 'forwardToActor' },
          SUBMIT: { actions: 'forwardToActor' },
        },
      },
      verifyUserAttributesActor: {
        invoke: {
          id: 'childActor',
          src: 'invokeVerifyUserAttributesActor',
          input: ({ context }) => context.actorDoneData,
          onDone: { actions: 'setActorDoneData', target: '#authenticator.getCurrentUser' },
        },
        on: {
          SKIP: { actions: 'forwardToActor' },
          RESEND: { actions: 'forwardToActor' },
          SUBMIT: { actions: 'forwardToActor' },
        },
      },
      authenticated: {
        initial: 'idle',
        on: { SIGN_OUT: 'signOut' },
        states: {
          idle: {
            on: {
              TOKEN_REFRESH: 'refreshUser',
            },
          },
          refreshUser: {
            invoke: {
              src: 'getCurrentUser',
              onDone: { actions: 'setUser', target: 'idle' },
              onError: { target: '#authenticator.signOut' },
            },
          },
        },
      },
      signOut: {
        invoke: {
          id: 'childActor',
          src: 'invokeSignOutActor',
          onDone: { actions: 'clearUser', target: '#authenticator.setup' },
        },
        exit: 'clearActorDoneData',
      },
    },
    on: {
      CHILD_CHANGED: { actions: assign(({ context }) => context) },
      SIGN_IN_WITH_REDIRECT: { target: '#authenticator.getCurrentUser' },
    },
  })
}
