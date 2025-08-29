import { describe, it } from 'vitest'
import { createActor } from 'xstate'
import { signOutActor } from './actor'

const flushPromises = () => new Promise(setImmediate)

describe('signOutActor', () => {
  it('サインアウト成功', async () => {
    const signOut = vi.fn().mockResolvedValue({})

    const actor = createActor(signOutActor({ signOut }))
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual('pending')
    actor.send({ type: 'SIGN_OUT' })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('resolved')
  })

  it('サインアウト処理中に失敗', async () => {
    const error = new Error('signOut failed')
    const signOut = vi.fn().mockRejectedValue(error)
    const service = createActor(signOutActor({ signOut }))
    service.start()

    expect(service.getSnapshot().value).toStrictEqual('pending')
    service.send({ type: 'SIGN_OUT' })
    await flushPromises()
    expect(service.getSnapshot().value).toStrictEqual('rejected')
  })
})
