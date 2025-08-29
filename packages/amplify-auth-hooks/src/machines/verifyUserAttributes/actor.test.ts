import type { SendUserAttributeVerificationCodeOutput } from '@aws-amplify/auth'
import { describe, it } from 'vitest'
import { createActor } from 'xstate'
import { verifyUserAttributesActor } from './actor'

const flushPromises = () => new Promise(setImmediate)

const mockConfirmationCode = '1234'

describe('verifyUserAttributes', () => {
  it('コード送信', async () => {
    const sendUserAttributeVerificationCode = vi
      .fn()
      .mockResolvedValue({ attributeName: 'email', deliveryMedium: 'EMAIL' } as SendUserAttributeVerificationCodeOutput)
    const confirmUserAttribute = vi.fn().mockResolvedValue({})

    const actor = createActor(
      verifyUserAttributesActor({ sendUserAttributeVerificationCode, confirmUserAttribute }).provide({
        actions: { sendUpdate: vi.fn() },
      }),
    )
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual({ selectUserAttributes: 'idle' })

    // コード送信
    actor.send({ type: 'SUBMIT', data: { userAttributeKey: 'email' } })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual({ confirmVerifyUserAttribute: 'idle' })
    expect(sendUserAttributeVerificationCode).toHaveBeenCalledWith({ userAttributeKey: 'email' })

    // コード入力
    actor.send({ type: 'SUBMIT', data: { confirmationCode: mockConfirmationCode } })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('resolved')
    expect(confirmUserAttribute).toHaveBeenCalledWith({ userAttributeKey: 'email', confirmationCode: mockConfirmationCode })
  })

  it('確認コード再送', async () => {
    const sendUserAttributeVerificationCode = vi
      .fn()
      .mockResolvedValue({ attributeName: 'email', deliveryMedium: 'EMAIL' } as SendUserAttributeVerificationCodeOutput)
    const confirmUserAttribute = vi.fn().mockResolvedValue({})

    const actor = createActor(
      verifyUserAttributesActor({ sendUserAttributeVerificationCode, confirmUserAttribute }).provide({
        actions: { sendUpdate: vi.fn() },
      }),
    )
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual({ selectUserAttributes: 'idle' })

    // コード送信
    actor.send({ type: 'SUBMIT', data: { userAttributeKey: 'email' } })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual({ confirmVerifyUserAttribute: 'idle' })
    expect(sendUserAttributeVerificationCode).toHaveBeenCalledWith({ userAttributeKey: 'email' })

    // コード再送
    actor.send({ type: 'RESEND', data: {} })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual({ confirmVerifyUserAttribute: 'idle' })
    expect(sendUserAttributeVerificationCode).toHaveBeenCalledTimes(2)
  })
})
