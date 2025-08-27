import type { ConfirmResetPasswordInput, ResetPasswordInput, ResetPasswordOutput } from '@aws-amplify/auth'
import { assign, fromPromise, sendParent, setup } from 'xstate'
import { setCodeDeliveryDetails, setNextResetPasswordStep, setNextSignInStep, setRemoteError } from '../actions'
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
      shouldResetPassword: ({ context, event }) => shouldResetPassword(event?.input?.step ?? context.step),
      shouldConfirmResetPassword: ({ context, event }) => shouldConfirmResetPassword(event?.input?.step ?? context.step),
      hasCompletedResetPassword: ({ event }) => hasCompletedResetPassword(event),
    },
    actors: {
      resetPassword: fromPromise<ResetPasswordOutput, ResetPasswordInput>(({ input }) => handlers.resetPassword(input)),
      confirmResetPassword: fromPromise<void, ConfirmResetPasswordInput>(({ input }) => handlers.confirmResetPassword(input)),
    },
    actions: {
      sendParent: sendParent({ type: 'CHILD_CHANGED' }),
      setCodeDeliveryDetails: assign({ codeDeliveryDetails: setCodeDeliveryDetails }),
      setNextResetPasswordStep: assign({ step: setNextResetPasswordStep }),
      setRemoteError: assign({ remoteError: setRemoteError }),
      setSignInStep: assign({ step: setNextSignInStep }),
    },
  }).createMachine({
    id: 'forgotPasswordActor',
    initial: 'init',
    context: overridesContext ?? { step: 'FORGOT_PASSWORD' },
    states: {
      init: {
        always: [
          { guard: 'shouldResetPassword', target: 'confirmResetPassword' },
          { guard: 'shouldConfirmResetPassword', target: 'confirmResetPassword' },
          { target: 'forgotPassword' },
        ],
      },
      forgotPassword: {
        initial: 'idle',
        states: {
          idle: {
            on: {
              SUBMIT: { target: 'submit' },
            },
          },
          submit: {
            tags: 'pending',
            invoke: {
              src: 'resetPassword',
              input: ({ context }) => ({ username: context.username ?? '' }) as ResetPasswordInput,
              onDone: [{ actions: ['setCodeDeliveryDetails', 'setNextResetPasswordStep'], target: '#forgotPasswordActor.confirmResetPassword' }],
              onError: { actions: 'setRemoteError', target: 'idle' },
            },
          },
        },
      },
      confirmResetPassword: {
        initial: 'idle',
        states: {
          idle: {
            on: {
              SUBMIT: { target: 'submit' },
              RESEND: { target: 'resendCode' },
            },
          },
          resendCode: {
            tags: 'pending',
            invoke: {
              src: 'resetPassword',
              input: ({ context }) =>
                ({
                  username: context.username ?? '',
                }) as ResetPasswordInput,
              onDone: { target: 'idle' },
              onError: { actions: 'setRemoteError', target: 'idle' },
            },
          },
          submit: {
            tags: 'pending',
            invoke: {
              src: 'confirmResetPassword',
              input: ({ context, event }) => {
                const data = event.data ?? {}
                return {
                  username: context.username,
                  confirmationCode: data.confirmationCode,
                  newPassword: data.newPassword,
                } as ConfirmResetPasswordInput
              },
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
  })
}
