import type { FetchUserAttributesOutput, GetCurrentUserOutput, SignInOutput } from '@aws-amplify/auth'
import { describe, it } from 'vitest'
import { createActor } from 'xstate'
import { createAuthenticatorMachine } from './index'
import type { Handlers } from './types'

const flushPromises = () => new Promise(setImmediate)

const mockUsername = 'test'
const mockPassword = 'test'
const mockConfirmationCode = '1234'

const mockHandlers = (overrides?: Partial<Handlers>): Handlers => {
  return {
    autoSignIn: vi.fn(),
    confirmSignUp: vi.fn(),
    confirmResetPassword: vi.fn(),
    confirmSignIn: vi.fn(),
    confirmUserAttribute: vi.fn(),
    fetchUserAttributes: vi.fn(),
    getCurrentUser: vi.fn(),
    resendSignUpCode: vi.fn(),
    resetPassword: vi.fn(),
    sendUserAttributeVerificationCode: vi.fn(),
    signIn: vi.fn(),
    signInWithRedirect: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    ...overrides,
  }
}

describe('authenticator', () => {
  it('サインアップに遷移すること', async () => {
    const handlers = mockHandlers()

    const actor = createActor(createAuthenticatorMachine({ initialState: 'signUp', handlers }))
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual('idle')
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('signUpActor')
  })

  it('サインインに遷移すること', async () => {
    const handlers = mockHandlers()

    const actor = createActor(createAuthenticatorMachine({ handlers }))
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual('idle')
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('signInActor')
  })

  it('パスワード忘れに遷移すること', async () => {
    const handlers = mockHandlers()

    const actor = createActor(createAuthenticatorMachine({ initialState: 'forgotPassword', handlers }))
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual('idle')
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('forgotPasswordActor')
  })

  it('サインアップから、サインイン・パスワード忘れに遷移できること', async () => {
    const handlers = mockHandlers()

    const actor = createActor(createAuthenticatorMachine({ initialState: 'signUp', handlers }))
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual('idle')
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('signUpActor')

    // サインインへ
    actor.send({ type: 'SIGN_IN' })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('signInActor')

    // サインアップへ
    actor.send({ type: 'SIGN_UP' })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('signUpActor')

    // サインインへ
    actor.send({ type: 'SIGN_IN' })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('signInActor')

    // パスワード忘れへ
    actor.send({ type: 'FORGOT_PASSWORD' })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('forgotPasswordActor')

    // サインインへ
    actor.send({ type: 'SIGN_IN' })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('signInActor')
  })

  it('サインイン後、認証済みに遷移すること', async () => {
    const signIn = vi.fn().mockResolvedValue({ nextStep: { signInStep: 'DONE' } } as SignInOutput)
    const fetchUserAttributes = vi.fn().mockResolvedValue({} as FetchUserAttributesOutput)
    const getCurrentUser = vi.fn().mockResolvedValue({ userId: mockUsername } as GetCurrentUserOutput)

    const handlers = mockHandlers({ signIn, fetchUserAttributes, getCurrentUser })

    const actor = createActor(createAuthenticatorMachine({ handlers }))
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual('idle')
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('signInActor')

    // サインイン
    actor.send({ type: 'SUBMIT', data: { username: mockUsername, password: mockPassword } })
    await flushPromises()

    expect(signIn).toHaveBeenCalledWith({ username: mockUsername, password: mockPassword })
    expect(fetchUserAttributes).toHaveBeenCalledTimes(1)

    expect(actor.getSnapshot().value).toStrictEqual({ authenticated: 'idle' })
    // getCurrentUserの値が格納されていること
    expect(actor.getSnapshot().context).toStrictEqual(expect.objectContaining({ user: { userId: mockUsername } }))
  })

  it('サインイン後、リセットパスワードに遷移すること', async () => {
    const signIn = vi.fn().mockResolvedValue({ nextStep: { signInStep: 'RESET_PASSWORD' } } as SignInOutput)
    const resetPassword = vi.fn().mockResolvedValue({} as FetchUserAttributesOutput)
    const fetchUserAttributes = vi.fn().mockResolvedValue({} as FetchUserAttributesOutput)
    const getCurrentUser = vi.fn().mockResolvedValue({ userId: mockUsername } as GetCurrentUserOutput)

    const handlers = mockHandlers({ signIn, fetchUserAttributes, getCurrentUser, resetPassword })

    const actor = createActor(createAuthenticatorMachine({ handlers }))
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual('idle')
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('signInActor')

    // サインイン
    actor.send({ type: 'SUBMIT', data: { username: mockUsername, password: mockPassword } })
    await flushPromises()

    expect(signIn).toHaveBeenCalledWith({ username: mockUsername, password: mockPassword })
    expect(fetchUserAttributes).not.toHaveBeenCalled()

    // パスワード忘れに遷移 / コード送信される
    expect(actor.getSnapshot().value).toStrictEqual('forgotPasswordActor')

    // パスワード変更
    actor.send({ type: 'SUBMIT', data: { confirmationCode: mockConfirmationCode, newPassword: mockPassword } })
    await flushPromises()
    expect(resetPassword).toBeCalledTimes(1)

    // パスワード変更後は、サインインに遷移
    expect(actor.getSnapshot().value).toStrictEqual('signInActor')

    // getCurrentUserの値が格納されていること
    expect(actor.getSnapshot().context).toStrictEqual(expect.objectContaining({ user: { userId: mockUsername } }))
  })

  it('サインイン後、トークン更新できること', async () => {
    const signIn = vi.fn().mockResolvedValue({ nextStep: { signInStep: 'DONE' } } as SignInOutput)
    const fetchUserAttributes = vi.fn().mockResolvedValue({} as FetchUserAttributesOutput)
    const getCurrentUser = vi.fn().mockResolvedValue({ userId: mockUsername } as GetCurrentUserOutput)

    const handlers = mockHandlers({ signIn, fetchUserAttributes, getCurrentUser })

    const actor = createActor(createAuthenticatorMachine({ handlers }))
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual('idle')
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('signInActor')

    // サインイン
    actor.send({ type: 'SUBMIT', data: { username: mockUsername, password: mockPassword } })
    await flushPromises()

    expect(actor.getSnapshot().value).toStrictEqual({ authenticated: 'idle' })
    expect(signIn).toHaveBeenCalledWith({ username: mockUsername, password: mockPassword })
    // サインイン済みかのチェックと、サインイン後の2回呼び出し
    expect(getCurrentUser).toHaveBeenCalledTimes(2)

    // getCurrentUserの値が格納されていること
    expect(actor.getSnapshot().context).toStrictEqual(expect.objectContaining({ user: { userId: mockUsername } }))

    getCurrentUser.mockResolvedValueOnce({ userId: mockUsername, token: 'newToken' })

    // トークン更新
    actor.send({ type: 'TOKEN_REFRESH' })
    await flushPromises()

    expect(getCurrentUser).toHaveBeenCalledTimes(3)

    // getCurrentUserの値が格納されていること
    expect(actor.getSnapshot().context).toStrictEqual(expect.objectContaining({ user: { userId: mockUsername, token: 'newToken' } }))
  })

  it('サインアウトに遷移すること', async () => {
    const signIn = vi.fn().mockResolvedValue({ nextStep: { signInStep: 'DONE' } } as SignInOutput)
    const resetPassword = vi.fn().mockResolvedValue({} as FetchUserAttributesOutput)
    const fetchUserAttributes = vi.fn().mockResolvedValue({} as FetchUserAttributesOutput)
    const getCurrentUser = vi.fn().mockResolvedValue({ userId: mockUsername } as GetCurrentUserOutput)

    const handlers = mockHandlers({ signIn, fetchUserAttributes, getCurrentUser, resetPassword })

    const actor = createActor(createAuthenticatorMachine({ handlers }))
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual('idle')
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('signInActor')

    // サインイン
    actor.send({ type: 'SUBMIT', data: { username: mockUsername, password: mockPassword } })
    await flushPromises()

    expect(actor.getSnapshot().value).toStrictEqual({ authenticated: 'idle' })

    // getCurrentUserの値が格納されていること
    expect(actor.getSnapshot().context).toStrictEqual(expect.objectContaining({ user: { userId: mockUsername } }))

    // サインアウト
    actor.send({ type: 'SIGN_OUT' })
    await flushPromises()

    // ユーザ情報が消えていること
    expect(actor.getSnapshot().value).toStrictEqual('signInActor')
    expect(actor.getSnapshot().context).toStrictEqual(expect.objectContaining({ user: undefined }))
  })
})
