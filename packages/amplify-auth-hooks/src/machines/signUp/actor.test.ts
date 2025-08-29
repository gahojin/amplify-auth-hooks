import type { ConfirmSignUpOutput, SignUpOutput } from '@aws-amplify/auth'
import { describe, it } from 'vitest'
import { createActor } from 'xstate'
import { signUpActor } from './actor'

const flushPromises = () => new Promise(setImmediate)

const mockUsername = 'test'
const mockPassword = 'test'
const mockEmail = 'test@amazon.com'
const mockConfirmationCode = '1234'

describe('signUpActor', () => {
  it('サインアップ成功', async () => {
    const autoSignIn = vi.fn().mockResolvedValue({})
    const confirmSignUp = vi.fn().mockResolvedValue({})
    const fetchUserAttributes = vi.fn().mockResolvedValue({})
    const resendSignUpCode = vi.fn().mockResolvedValue({})
    const resetPassword = vi.fn().mockResolvedValue({})
    const signInWithRedirect = vi.fn().mockResolvedValue({})
    const signUp = vi.fn().mockResolvedValue({ nextStep: { signUpStep: 'DONE' }, isSignUpComplete: true } as SignUpOutput)

    const actor = createActor(
      signUpActor({ autoSignIn, confirmSignUp, fetchUserAttributes, resendSignUpCode, resetPassword, signInWithRedirect, signUp }).provide({
        actions: { sendUpdate: vi.fn() },
      }),
    )
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual({ signUp: 'idle' })

    actor.send({ type: 'SUBMIT', data: { username: mockUsername, password: mockPassword, email: mockEmail } })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('resolved')
    expect(signUp).toHaveBeenCalledWith({ email: mockEmail, password: mockPassword, username: mockUsername })
  })

  it('サインアップ後に確認コード入力', async () => {
    const autoSignIn = vi.fn().mockResolvedValue({})
    const confirmSignUp = vi.fn().mockResolvedValue({ nextStep: { signUpStep: 'DONE' } } as ConfirmSignUpOutput)
    const fetchUserAttributes = vi.fn().mockResolvedValue({})
    const resendSignUpCode = vi.fn().mockResolvedValue({})
    const resetPassword = vi.fn().mockResolvedValue({})
    const signInWithRedirect = vi.fn().mockResolvedValue({})
    const signUp = vi.fn().mockResolvedValue({ nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } } as SignUpOutput)

    const actor = createActor(
      signUpActor({ autoSignIn, confirmSignUp, fetchUserAttributes, resendSignUpCode, resetPassword, signInWithRedirect, signUp }).provide({
        actions: { sendUpdate: vi.fn() },
      }),
    )
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual({ signUp: 'idle' })

    actor.send({ type: 'SUBMIT', data: { username: mockUsername, password: mockPassword, email: mockEmail } })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual({ confirmSignUp: 'idle' })
    expect(signUp).toHaveBeenCalledWith({ email: mockEmail, password: mockPassword, username: mockUsername })

    // コード入力
    actor.send({ type: 'SUBMIT', data: { confirmationCode: mockConfirmationCode } })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('resolved')
    expect(confirmSignUp).toHaveBeenCalledWith({ username: mockUsername, confirmationCode: mockConfirmationCode })
  })

  it('サインアップ後に確認コード再送', async () => {
    const autoSignIn = vi.fn().mockResolvedValue({})
    const confirmSignUp = vi.fn().mockResolvedValue({ nextStep: { signUpStep: 'DONE' } } as ConfirmSignUpOutput)
    const fetchUserAttributes = vi.fn().mockResolvedValue({})
    const resendSignUpCode = vi.fn().mockResolvedValue({})
    const resetPassword = vi.fn().mockResolvedValue({})
    const signInWithRedirect = vi.fn().mockResolvedValue({})
    const signUp = vi.fn().mockResolvedValue({ nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } } as SignUpOutput)

    const actor = createActor(
      signUpActor({ autoSignIn, confirmSignUp, fetchUserAttributes, resendSignUpCode, resetPassword, signInWithRedirect, signUp }).provide({
        actions: { sendUpdate: vi.fn() },
      }),
    )
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual({ signUp: 'idle' })

    actor.send({ type: 'SUBMIT', data: { username: mockUsername, password: mockPassword, email: mockEmail } })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual({ confirmSignUp: 'idle' })
    expect(signUp).toHaveBeenCalledWith({ email: mockEmail, password: mockPassword, username: mockUsername })

    // コード再送
    actor.send({ type: 'RESEND', data: {} })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual({ confirmSignUp: 'idle' })
    expect(resendSignUpCode).toHaveBeenCalledWith({ username: mockUsername })
  })

  it('確認済みの状態で、確認コード再送', async () => {
    const autoSignIn = vi.fn().mockResolvedValue({})
    const confirmSignUp = vi.fn().mockResolvedValue({ nextStep: { signUpStep: 'DONE' } } as ConfirmSignUpOutput)
    const fetchUserAttributes = vi.fn().mockResolvedValue({})
    const resendSignUpCode = vi.fn().mockRejectedValue(Error('User is already confirmed.'))
    const resetPassword = vi.fn().mockResolvedValue({})
    const signInWithRedirect = vi.fn().mockResolvedValue({})
    const signUp = vi.fn().mockResolvedValue({ nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } } as SignUpOutput)

    const actor = createActor(
      signUpActor({ autoSignIn, confirmSignUp, fetchUserAttributes, resendSignUpCode, resetPassword, signInWithRedirect, signUp }).provide({
        actions: { sendUpdate: vi.fn() },
      }),
    )
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual({ signUp: 'idle' })

    actor.send({ type: 'SUBMIT', data: { username: mockUsername, password: mockPassword, email: mockEmail } })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual({ confirmSignUp: 'idle' })
    expect(signUp).toHaveBeenCalledWith({ email: mockEmail, password: mockPassword, username: mockUsername })

    // コード再送
    actor.send({ type: 'RESEND', data: {} })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('resolved')
    expect(resendSignUpCode).toHaveBeenCalledWith({ username: mockUsername })
  })
})
