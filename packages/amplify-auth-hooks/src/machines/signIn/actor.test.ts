import type { ConfirmSignInOutput, FetchUserAttributesOutput, ResendSignUpCodeOutput, ResetPasswordOutput, SignInOutput } from '@aws-amplify/auth'
import { createTestModel } from '@xstate/graph'
import { describe, it } from 'vitest'
import { createActor } from 'xstate'
import { signInActor } from './actor'

const flushPromises = () => new Promise(setImmediate)

const mockUsername = 'test'
const mockPassword = 'test'
const mockEmail = 'test@amazon.com'
const mockConfirmationCode = '1234'

describe('signInActor', () => {
  it('サインイン成功', async () => {
    const signIn = vi.fn().mockResolvedValue({ nextStep: { signInStep: 'DONE' } } as SignInOutput)
    const signInWithRedirect = vi.fn().mockResolvedValue({})
    const confirmSignIn = vi.fn().mockResolvedValue({})
    const fetchUserAttributes = vi.fn().mockResolvedValue({})
    const resendSignUpCode = vi.fn().mockResolvedValue({})
    const resetPassword = vi.fn().mockResolvedValue({})

    const actor = createActor(signInActor({ signIn, signInWithRedirect, confirmSignIn, fetchUserAttributes, resendSignUpCode, resetPassword }), { parent: vi.fn()})
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual({ signIn: 'idle' })

    actor.send({ type: 'SUBMIT', data: { username: mockUsername, password: mockPassword, email: mockEmail } })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('resolved')
    expect(signIn).toHaveBeenCalledWith({ email: mockEmail, password: mockPassword, username: mockUsername })
  })

  it('フェデレーションサインイン', async () => {
    const signIn = vi.fn().mockResolvedValue({ nextStep: { signInStep: 'DONE' } } as SignInOutput)
    const signInWithRedirect = vi.fn().mockResolvedValue({})
    const confirmSignIn = vi.fn().mockResolvedValue({})
    const fetchUserAttributes = vi.fn().mockResolvedValue({})
    const resendSignUpCode = vi.fn().mockResolvedValue({})
    const resetPassword = vi.fn().mockResolvedValue({})

    const actor = createActor(signInActor({ signIn, signInWithRedirect, confirmSignIn, fetchUserAttributes, resendSignUpCode, resetPassword }))
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual({ signIn: 'idle' })

    actor.send({ type: 'FEDERATED_SIGN_IN', data: { provider: 'Apple' } })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual({ signIn: 'idle' })

    expect(signInWithRedirect).toHaveBeenCalledWith({ provider: 'Apple' })
  })

  it('ユーザ属性検証がされること', async () => {
    const signIn = vi.fn().mockResolvedValue({ nextStep: { signInStep: 'DONE' } } as SignInOutput)
    const signInWithRedirect = vi.fn().mockResolvedValue({})
    const confirmSignIn = vi.fn().mockResolvedValue({})
    const fetchUserAttributes = vi.fn().mockResolvedValue({ email: mockEmail } as FetchUserAttributesOutput)
    const resendSignUpCode = vi.fn().mockResolvedValue({})
    const resetPassword = vi.fn().mockResolvedValue({})

    const actor = createActor(
      signInActor(
        { signIn, signInWithRedirect, confirmSignIn, fetchUserAttributes, resendSignUpCode, resetPassword },
        {
          user: { username: mockUsername, userId: 'userId' },
          step: 'SIGN_IN',
        },
      ),{parent: }
    )
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual({ signIn: 'idle' })

    actor.send({ type: 'SUBMIT', data: { username: mockUsername, password: mockPassword } })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('resolved')

    expect(fetchUserAttributes).toHaveBeenCalledTimes(1)
    expect(actor.getSnapshot().context).toStrictEqual({
      step: 'SHOULD_CONFIRM_USER_ATTRIBUTE',
      unverifiedUserAttributes: { email: mockEmail },
      user: { userId: 'userId', username: mockUsername },
    })
  })

  it('フェデレーションサインイン', async () => {
    const signIn = vi.fn().mockResolvedValue({ nextStep: { signInStep: 'DONE' } } as SignInOutput)
    const signInWithRedirect = vi.fn().mockResolvedValue({})
    const confirmSignIn = vi.fn().mockResolvedValue({})
    const fetchUserAttributes = vi.fn().mockResolvedValue({})
    const resendSignUpCode = vi.fn().mockResolvedValue({})
    const resetPassword = vi.fn().mockResolvedValue({})

    const actor = createActor(signInActor({ signIn, signInWithRedirect, confirmSignIn, fetchUserAttributes, resendSignUpCode, resetPassword }))
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual({ signIn: 'idle' })

    actor.send({ type: 'FEDERATED_SIGN_IN', data: { provider: 'Apple' } })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual({ signIn: 'idle' })

    expect(signInWithRedirect).toHaveBeenCalledWith({ provider: 'Apple' })
  })

  it('ユーザ属性検証がされること', async () => {
    const signIn = vi.fn().mockResolvedValue({ nextStep: { signInStep: 'DONE' } } as SignInOutput)
    const signInWithRedirect = vi.fn().mockResolvedValue({})
    const confirmSignIn = vi.fn().mockResolvedValue({})
    const fetchUserAttributes = vi.fn().mockResolvedValue({ email: mockEmail } as FetchUserAttributesOutput)
    const resendSignUpCode = vi.fn().mockResolvedValue({})
    const resetPassword = vi.fn().mockResolvedValue({})

    const actor = createActor(
      signInActor(
        { signIn, signInWithRedirect, confirmSignIn, fetchUserAttributes, resendSignUpCode, resetPassword },
        {
          user: { username: mockUsername, userId: 'userId' },
          step: 'SIGN_IN',
        },
      ),
    )
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual({ signIn: 'idle' })

    actor.send({ type: 'SUBMIT', data: { username: mockUsername, password: mockPassword } })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('resolved')

    expect(fetchUserAttributes).toHaveBeenCalledTimes(1)
    expect(actor.getSnapshot().context).toStrictEqual({
      step: 'SHOULD_CONFIRM_USER_ATTRIBUTE',
      unverifiedUserAttributes: { email: mockEmail },
      user: { userId: 'userId', username: mockUsername },
    })
  })

  it.each([{ step: 'CONFIRM_SIGN_IN_WITH_TOTP_CODE' }, { step: 'CONFIRM_SIGN_IN_WITH_SMS_CODE' }, { step: 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE' }])(
    '$stepの時、confirmSignInに遷移すること',
    async ({ step }) => {
      const signIn = vi.fn().mockResolvedValue({ nextStep: { signInStep: step } } as SignInOutput)
      const signInWithRedirect = vi.fn().mockResolvedValue({})
      const confirmSignIn = vi.fn().mockResolvedValue({ nextStep: { signInStep: 'DONE' } } as ConfirmSignInOutput)
      const fetchUserAttributes = vi.fn().mockResolvedValue({ email: mockEmail } as FetchUserAttributesOutput)
      const resendSignUpCode = vi.fn().mockResolvedValue({})
      const resetPassword = vi.fn().mockResolvedValue({})

      const actor = createActor(signInActor({ signIn, signInWithRedirect, confirmSignIn, fetchUserAttributes, resendSignUpCode, resetPassword }))
      actor.start()

      expect(actor.getSnapshot().value).toStrictEqual({ signIn: 'idle' })

      actor.send({ type: 'SUBMIT', data: { username: mockUsername, password: mockPassword } })
      await flushPromises()
      expect(actor.getSnapshot().value).toStrictEqual({ confirmSignIn: 'idle' })

      actor.send({ type: 'SUBMIT', data: { challengeResponse: mockConfirmationCode } })
      await flushPromises()
      expect(actor.getSnapshot().value).toStrictEqual('resolved')

      expect(confirmSignIn).toHaveBeenCalledWith({ challengeResponse: mockConfirmationCode })
    },
  )

  it('CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIREDの場合、パスワード入力に遷移すること', async () => {
    const signIn = vi.fn().mockResolvedValue({ nextStep: { signInStep: 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED' } } as SignInOutput)
    const signInWithRedirect = vi.fn().mockResolvedValue({})
    const confirmSignIn = vi.fn().mockResolvedValue({ nextStep: { signInStep: 'DONE' } } as ConfirmSignInOutput)
    const fetchUserAttributes = vi.fn().mockResolvedValue({ email: mockEmail } as FetchUserAttributesOutput)
    const resendSignUpCode = vi.fn().mockResolvedValue({})
    const resetPassword = vi.fn().mockResolvedValue({})

    const actor = createActor(signInActor({ signIn, signInWithRedirect, confirmSignIn, fetchUserAttributes, resendSignUpCode, resetPassword }))
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual({ signIn: 'idle' })

    actor.send({ type: 'SUBMIT', data: { username: mockUsername, password: mockPassword, email: mockEmail } })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual({ forceChangePassword: 'idle' })

    actor.send({ type: 'SUBMIT', data: { challengeResponse: mockPassword } })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('resolved')

    expect(confirmSignIn).toHaveBeenCalledWith({ challengeResponse: mockPassword })
  })

  it('TOTPが必須の場合、セットアップに遷移すること', async () => {
    const signIn = vi.fn().mockResolvedValue({ nextStep: { signInStep: 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP' } } as SignInOutput)
    const signInWithRedirect = vi.fn().mockResolvedValue({})
    const confirmSignIn = vi.fn().mockResolvedValue({ nextStep: { signInStep: 'DONE' } } as ConfirmSignInOutput)
    const fetchUserAttributes = vi.fn().mockResolvedValue({ email: mockEmail } as FetchUserAttributesOutput)
    const resendSignUpCode = vi.fn().mockResolvedValue({})
    const resetPassword = vi.fn().mockResolvedValue({})

    const actor = createActor(signInActor({ signIn, signInWithRedirect, confirmSignIn, fetchUserAttributes, resendSignUpCode, resetPassword }))
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual({ signIn: 'idle' })

    actor.send({ type: 'SUBMIT', data: { username: mockUsername, password: mockPassword } })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual({ setupTotp: 'idle' })

    actor.send({ type: 'SUBMIT', data: { challengeResponse: mockConfirmationCode } })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('resolved')

    expect(confirmSignIn).toHaveBeenCalledWith({ challengeResponse: mockConfirmationCode })
  })

  it('パスワードがリセットされた場合、リダイレクトすること(stepがRESET_PASSWORDになること)', async () => {
    const signIn = vi.fn().mockResolvedValue({ nextStep: { signInStep: 'RESET_PASSWORD' } } as SignInOutput)
    const signInWithRedirect = vi.fn().mockResolvedValue({})
    const confirmSignIn = vi.fn().mockResolvedValue({})
    const fetchUserAttributes = vi.fn().mockResolvedValue({ email: mockEmail } as FetchUserAttributesOutput)
    const resendSignUpCode = vi.fn().mockResolvedValue({})
    const resetPassword = vi.fn().mockResolvedValue({ nextStep: { resetPasswordStep: 'CONFIRM_RESET_PASSWORD_WITH_CODE' } } as ResetPasswordOutput)

    const actor = createActor(signInActor({ signIn, signInWithRedirect, confirmSignIn, fetchUserAttributes, resendSignUpCode, resetPassword }))
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual({ signIn: 'idle' })

    actor.send({ type: 'SUBMIT', data: { username: mockUsername, password: mockPassword } })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('resolved')
    expect(actor.getSnapshot().context).toStrictEqual({
      codeDeliveryDetails: { nextStep: { resetPasswordStep: 'CONFIRM_RESET_PASSWORD_WITH_CODE' } },
      step: 'RESET_PASSWORD',
    })
  })

  it('ユーザ未確認の場合、リダイレクトすること(stepがRESET_PASSWORDになること)', async () => {
    const signIn = vi.fn().mockResolvedValue({ nextStep: { signInStep: 'CONFIRM_SIGN_UP' } } as SignInOutput)
    const signInWithRedirect = vi.fn().mockResolvedValue({})
    const confirmSignIn = vi.fn().mockResolvedValue({})
    const fetchUserAttributes = vi.fn().mockResolvedValue({})
    const resendSignUpCode = vi.fn().mockResolvedValue({ attributeName: 'email' } as ResendSignUpCodeOutput)
    const resetPassword = vi.fn().mockResolvedValue({})

    const actor = createActor(signInActor({ signIn, signInWithRedirect, confirmSignIn, fetchUserAttributes, resendSignUpCode, resetPassword }))
    actor.start()

    expect(actor.getSnapshot().value).toStrictEqual({ signIn: 'idle' })

    actor.send({ type: 'SUBMIT', data: { username: mockUsername, password: mockPassword } })
    await flushPromises()
    expect(actor.getSnapshot().value).toStrictEqual('resolved')
    expect(actor.getSnapshot().context).toStrictEqual({
      codeDeliveryDetails: { attributeName: 'email' },
      step: 'CONFIRM_SIGN_UP',
    })
  })
})
