import type { ResetPasswordOutput } from '@aws-amplify/auth'
import { describe, it } from 'vitest'
import { createActor } from 'xstate'
import { forgotPasswordActor } from './actor'

const flushPromises = () => new Promise(setImmediate)

const mockUsername = 'test'
const mockPassword = 'test'
const mockConfirmationCode = '1234'

describe('forgotPasswordActor', () => {
  it('コード送信からコード入力完了までの遷移', async () => {
    const confirmResetPassword = vi.fn().mockResolvedValue({})
    const resetPassword = vi.fn().mockResolvedValue({ nextStep: {}, isPasswordReset: true } as ResetPasswordOutput)

    const actor = createActor(
      forgotPasswordActor({ confirmResetPassword, resetPassword }, { username: mockUsername, step: 'FORGOT_PASSWORD' }).provide({
        actions: { sendUpdate: vi.fn() },
      }),
    )
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual({ forgotPassword: 'idle' })
    actor.send({ type: 'FORGOT_PASSWORD' })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual({ forgotPassword: 'idle' })

    // コード送信
    actor.send({ type: 'SUBMIT', data: { username: mockUsername } })
    await flushPromises()
    expect(resetPassword).toHaveBeenCalledWith({ username: mockUsername })
    expect(actor.getSnapshot().value).toStrictEqual({
      confirmResetPassword: 'idle',
    })

    // コード入力
    actor.send({ type: 'SUBMIT', data: { confirmationCode: mockConfirmationCode, newPassword: mockPassword } })
    await flushPromises()
    expect(confirmResetPassword).toHaveBeenCalledWith({
      username: mockUsername,
      newPassword: mockPassword,
      confirmationCode: mockConfirmationCode,
    })
    expect(actor.getSnapshot().value).toStrictEqual('resolved')
  })

  it('コードの再送', async () => {
    const confirmResetPassword = vi.fn().mockResolvedValue({})
    const resetPassword = vi.fn().mockResolvedValue({ nextStep: {}, isPasswordReset: true } as ResetPasswordOutput)

    const actor = createActor(
      forgotPasswordActor({ confirmResetPassword, resetPassword }, { username: mockUsername, step: 'FORGOT_PASSWORD' }).provide({
        actions: { sendUpdate: vi.fn() },
      }),
    )
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual({ forgotPassword: 'idle' })
    actor.send({ type: 'FORGOT_PASSWORD' })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual({ forgotPassword: 'idle' })

    // コード送信
    actor.send({ type: 'SUBMIT', data: { username: mockUsername } })
    await flushPromises()
    expect(resetPassword).toHaveBeenCalledWith({
      username: mockUsername,
    })
    expect(actor.getSnapshot().value).toStrictEqual({
      confirmResetPassword: 'idle',
    })

    // コード再送
    actor.send({ type: 'RESEND' })
    await flushPromises()
    expect(resetPassword).toHaveBeenCalledWith({
      username: mockUsername,
    })
    expect(resetPassword).toHaveBeenCalledTimes(2)
    expect(actor.getSnapshot().value).toStrictEqual({
      confirmResetPassword: 'idle',
    })
  })
})
