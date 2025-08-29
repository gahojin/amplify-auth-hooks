import type { ConfirmResetPasswordInput, ResetPasswordInput, ResetPasswordOutput } from '@aws-amplify/auth'
import { assign, fromPromise, sendParent, setup } from 'xstate'
import { setCodeDeliveryDetails, setNextResetPasswordStep, setNextSignInStep, setRemoteError, setUsername } from '../actions'
import { hasCompletedResetPassword, shouldConfirmResetPassword, shouldResetPassword } from '../guards'
import type { AuthEvent, Handlers, ResetPasswordContext } from '../types'

type ForgotPasswordHandlers = Pick<Handlers, 'resetPassword' | 'confirmResetPassword'>

/**
 * @internal
 */
export const forgotPasswordActor = (handlers: ForgotPasswordHandlers, overridesContext?: ResetPasswordContext) => {
  return setup({
    types: {
      context: {} as ResetPasswordContext,
      events: {} as AuthEvent,
    },
    guards: {
      shouldResetPassword: ({ context, event }) => shouldResetPassword(context, event),
      shouldConfirmResetPassword: ({ context, event }) => shouldConfirmResetPassword(context, event),
      hasCompletedResetPassword: ({ event }) => hasCompletedResetPassword(event),
    },
    actors: {
      resetPassword: fromPromise<ResetPasswordOutput, ResetPasswordInput>(({ input }) => handlers.resetPassword(input)),
      confirmResetPassword: fromPromise<void, ConfirmResetPasswordInput>(({ input }) => handlers.confirmResetPassword(input)),
    },
    actions: {
      sendUpdate: sendParent({ type: 'CHILD_CHANGED' }),
      setCodeDeliveryDetails: assign({ codeDeliveryDetails: setCodeDeliveryDetails }),
      setNextResetPasswordStep: assign({ step: setNextResetPasswordStep }),
      setSignInStep: assign({ step: setNextSignInStep }),
      setUsername: assign({ username: setUsername }),
      setRemoteError: assign({ remoteError: setRemoteError }),
      clearError: assign({ remoteError: undefined }),
    },
  }).createMachine({
    id: 'forgotPasswordActor',
    initial: 'init',
    context: ({ input }) => ({ step: 'FORGOT_PASSWORD', ...overridesContext, ...input }),
    states: {
      init: {
        always: [
          { guard: 'shouldResetPassword', target: '#forgotPasswordActor.confirmResetPassword' },
          { guard: 'shouldConfirmResetPassword', target: '#forgotPasswordActor.confirmResetPassword' },
          { target: '#forgotPasswordActor.forgotPassword' },
        ],
      },
      forgotPassword: {
        initial: 'idle',
        exit: 'clearError',
        states: {
          idle: {
            entry: 'sendUpdate',
            on: {
              SUBMIT: { target: 'submit' },
            },
          },
          submit: {
            tags: 'pending',
            entry: ['sendUpdate', 'setUsername', 'clearError'],
            invoke: {
              src: 'resetPassword',
              input: ({ context: { username } }) => ({ username }) as ResetPasswordInput,
              onDone: [{ actions: ['setCodeDeliveryDetails', 'setNextResetPasswordStep'], target: '#forgotPasswordActor.confirmResetPassword' }],
              onError: { actions: 'setRemoteError', target: 'idle' },
            },
          },
        },
      },
      confirmResetPassword: {
        initial: 'idle',
        exit: 'clearError',
        states: {
          idle: {
            entry: 'sendUpdate',
            on: {
              SUBMIT: { target: 'submit' },
              RESEND: { target: 'resendCode' },
            },
          },
          resendCode: {
            tags: 'pending',
            entry: ['sendUpdate', 'clearError'],
            invoke: {
              src: 'resetPassword',
              input: ({ context: { username } }) => ({ username }) as ResetPasswordInput,
              onDone: { target: 'idle' },
              onError: { actions: 'setRemoteError', target: 'idle' },
            },
          },
          submit: {
            tags: 'pending',
            entry: ['sendUpdate', 'clearError'],
            invoke: {
              src: 'confirmResetPassword',
              input: ({ context, event }) => ({ username: context.username, ...event.data }) as ConfirmResetPasswordInput,
              onDone: [
                { guard: 'hasCompletedResetPassword', actions: 'setNextResetPasswordStep', target: '#forgotPasswordActor.resolved' },
                { actions: 'setSignInStep', target: '#forgotPasswordActor.resolved' },
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
