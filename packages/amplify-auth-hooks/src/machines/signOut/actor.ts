import { fromPromise, setup } from 'xstate'
import type { Handlers, SignOutContext } from '../types'

type SignOutHandlers = Pick<Handlers, 'signOut'>

/**
 * @internal
 */
export const signOutActor = (handlers: SignOutHandlers) => {
  return setup({
    types: {
      context: {} as SignOutContext,
    },
    actors: {
      signOut: fromPromise(() => handlers.signOut()),
    },
  }).createMachine({
    id: 'signOutActor',
    initial: 'pending',
    context: {},
    states: {
      pending: {
        tags: 'pending',
        invoke: {
          src: 'signOut',
          onDone: 'resolved',
          onError: 'rejected',
        },
      },
      resolved: { type: 'final' },
      rejected: { type: 'final' },
    },
    output: ({ context }) => context,
  })
}
