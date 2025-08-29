import type { ConfirmUserAttributeInput, SendUserAttributeVerificationCodeInput, SendUserAttributeVerificationCodeOutput } from '@aws-amplify/auth'
import { assign, fromPromise, sendParent, setup } from 'xstate'
import { setCodeDeliveryDetails, setConfirmAttributeCompleteStep, setRemoteError, setSelectedUserAttribute } from '../actions'
import type { AuthEvent, Handlers, VerifyUserContext } from '../types'

type VerifyUserAttributesHandlers = Pick<Handlers, 'sendUserAttributeVerificationCode' | 'confirmUserAttribute'>

/**
 * @internal
 */
export const verifyUserAttributesActor = (handlers: VerifyUserAttributesHandlers, overridesContext?: VerifyUserContext) => {
  return setup({
    types: {
      context: {} as VerifyUserContext,
      events: {} as AuthEvent,
    },
    guards: {},
    actors: {
      sendUserAttributeVerificationCode: fromPromise<SendUserAttributeVerificationCodeOutput, SendUserAttributeVerificationCodeInput>(({ input }) =>
        handlers.sendUserAttributeVerificationCode(input),
      ),
      confirmVerifyUserAttribute: fromPromise<void, ConfirmUserAttributeInput>(({ input }) => handlers.confirmUserAttribute(input)),
    },
    actions: {
      sendUpdate: sendParent({ type: 'CHILD_CHANGED' }),
      setCodeDeliveryDetails: assign({ codeDeliveryDetails: setCodeDeliveryDetails }),
      setSelectedUserAttribute: assign({ selectedUserAttribute: setSelectedUserAttribute }),
      setConfirmAttributeCompleteStep: assign({ step: setConfirmAttributeCompleteStep }),
      setRemoteError: assign({ remoteError: setRemoteError }),
      clearError: assign({ remoteError: undefined }),
      clearSelectedUserAttribute: assign({ selectedUserAttribute: undefined }),
    },
  }).createMachine({
    id: 'vefiryUserAttributesActor',
    initial: 'selectUserAttributes',
    context: ({ input }) => ({ step: 'SIGN_IN', ...overridesContext, ...input }),
    states: {
      selectUserAttributes: {
        initial: 'idle',
        exit: 'clearError',
        states: {
          idle: {
            entry: 'sendUpdate',
            on: {
              SKIP: { target: '#vefiryUserAttributesActor.resolved' },
              SUBMIT: { target: 'submit' },
            },
          },
          submit: {
            tags: 'pending',
            entry: ['sendUpdate', 'clearError'],
            invoke: {
              src: 'sendUserAttributeVerificationCode',
              input: ({ event }) => event.data as SendUserAttributeVerificationCodeInput,
              onDone: {
                actions: ['setSelectedUserAttribute', 'setCodeDeliveryDetails'],
                target: '#vefiryUserAttributesActor.confirmVerifyUserAttribute',
              },
              onError: { actions: 'setRemoteError', target: 'idle' },
            },
          },
        },
      },
      confirmVerifyUserAttribute: {
        initial: 'idle',
        exit: 'clearError',
        states: {
          idle: {
            entry: 'sendUpdate',
            on: {
              SUBMIT: { target: 'submit' },
              RESEND: { target: 'resendCode' },
              SKIP: { target: '#vefiryUserAttributesActor.resolved' },
            },
          },
          resendCode: {
            tags: 'pending',
            entry: ['sendUpdate', 'clearError'],
            invoke: {
              src: 'sendUserAttributeVerificationCode',
              input: ({ context, event }) =>
                ({ userAttributeKey: context.selectedUserAttribute, ...event.data }) as SendUserAttributeVerificationCodeInput,
              onDone: { target: 'idle' },
              onError: { actions: 'setRemoteError', target: 'idle' },
            },
          },
          submit: {
            tags: 'pending',
            entry: ['sendUpdate', 'clearError'],
            invoke: {
              src: 'confirmVerifyUserAttribute',
              input: ({ context, event }) => ({ userAttributeKey: context.selectedUserAttribute, ...event.data }) as ConfirmUserAttributeInput,
              onDone: { actions: ['setConfirmAttributeCompleteStep', 'clearSelectedUserAttribute'], target: '#vefiryUserAttributesActor.resolved' },
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
