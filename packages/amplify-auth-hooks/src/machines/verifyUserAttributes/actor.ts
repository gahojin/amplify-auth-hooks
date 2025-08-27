import type { ConfirmUserAttributeInput, SendUserAttributeVerificationCodeInput, SendUserAttributeVerificationCodeOutput } from '@aws-amplify/auth'
import { assign, fromPromise, setup } from 'xstate'
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
      setCodeDeliveryDetails: assign({ codeDeliveryDetails: setCodeDeliveryDetails }),
      setSelectedUserAttribute: assign({ selectedUserAttribute: setSelectedUserAttribute }),
      setConfirmAttributeCompleteStep: assign({ step: setConfirmAttributeCompleteStep }),
      setRemoteError: assign({ remoteError: setRemoteError }),
      clearSelectedUserAttribute: assign({ selectedUserAttribute: undefined }),
    },
  }).createMachine({
    id: 'vefiryUserAttributesActor',
    initial: 'selectUserAttributes',
    context: overridesContext ?? { step: 'SIGN_IN' },
    states: {
      selectUserAttributes: {
        initial: 'idle',
        states: {
          idle: {
            on: {
              SUBMIT: { target: 'submit' },
              SKIP: { target: '#vefiryUserAttributesActor.resolved' },
            },
          },
          submit: {
            tags: 'pending',
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
        states: {
          idle: {
            on: {
              SUBMIT: { target: 'submit' },
              SKIP: { target: '#vefiryUserAttributesActor.resolved' },
            },
          },
          submit: {
            tags: 'pending',
            invoke: {
              src: 'confirmVerifyUserAttribute',
              input: ({ event }) => event.data as ConfirmUserAttributeInput,
              onDone: { actions: ['setConfirmAttributeCompleteStep', 'clearSelectedUserAttribute'], target: '#vefiryUserAttributesActor.resolved' },
              onError: { actions: 'setRemoteError', target: 'idle' },
            },
          },
        },
      },
      resolved: { target: 'final' },
    },
    output: ({ context }) => context,
  })
}
