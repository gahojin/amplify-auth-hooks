import { Hub } from '@aws-amplify/core'
import { render, waitFor } from '@testing-library/react'
import { act } from 'react'
import AuthenticatorProvider from 'src/context/AuthenticatorProvider'
import { describe, it } from 'vitest'
import { useAuthenticator } from '../hooks/useAuthenticator'

// 呼び出し確認のため、aws-amplifyをモック化する
vi.mock('aws-amplify')

const hubListenSpy = vi.spyOn(Hub, 'listen')

const TestComponent = () => {
  const { route } = useAuthenticator(({ route }) => [route])
  return <>{route}</>
}

describe('AuthenticatorProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Auth Hubイベント購読していること', async () => {
    render(
      <AuthenticatorProvider>
        <TestComponent />
      </AuthenticatorProvider>,
    )

    await waitFor(() => {
      expect(hubListenSpy).toBeCalledTimes(1)
      expect(hubListenSpy).toHaveBeenCalledWith('auth', expect.any(Function), 'authenticator-hub-handler')
    })
  })

  it('unmountでイベント購読が解除されること', async () => {
    const unsubscribe = vi.fn()
    hubListenSpy.mockReturnValue(unsubscribe)

    const { unmount } = render(
      <AuthenticatorProvider>
        <TestComponent />
      </AuthenticatorProvider>,
    )

    await waitFor(() => {
      expect(hubListenSpy).toBeCalledTimes(1)
    })

    act(() => unmount())

    await waitFor(() => {
      expect(unsubscribe).toHaveBeenCalledTimes(1)
    })
  })

  it('未サインイン時のステータス確認', async () => {
    const getCurrentUser = vi.fn().mockResolvedValue(undefined)

    const { getByText } = render(
      <AuthenticatorProvider options={{ handlers: { getCurrentUser } }}>
        <TestComponent />
      </AuthenticatorProvider>,
    )

    await waitFor(() => {
      expect(getByText('signIn')).toBeDefined()
      expect(getCurrentUser).toHaveResolvedTimes(1)
    })
  })

  it('サインイン済み時のステータス確認', async () => {
    const getCurrentUser = vi.fn().mockResolvedValue({ userId: '1234', username: 'test' })

    const { getByText } = render(
      <AuthenticatorProvider options={{ handlers: { getCurrentUser } }}>
        <TestComponent />
      </AuthenticatorProvider>,
    )

    await waitFor(() => {
      expect(getByText('authenticated')).toBeDefined()
      expect(getCurrentUser).toHaveResolvedTimes(1)
    })
  })
})
