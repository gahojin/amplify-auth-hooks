import { type AuthUser, getCurrentUser } from '@aws-amplify/auth'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from 'src/hooks/useAuth'
import { describe, it } from 'vitest'

// 呼び出し確認のため、aws-amplifyをモック化する
vi.mock('@aws-amplify/auth')

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ユーザ情報が取得できること', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ userId: 'test!!!' } as AuthUser)
    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current).toEqual({ user: { userId: 'test!!!' }, isLoading: false })
    })
  })

  it('オーバライドできること', async () => {
    const getCurrentUserMock = vi.fn().mockResolvedValue({ userId: 'test' } as AuthUser)
    const { result } = renderHook(() => {
      return useAuth({ getCurrentUser: getCurrentUserMock })
    })

    await waitFor(() => {
      expect(result.current).toEqual({ user: { userId: 'test' }, isLoading: false })
    })
  })
})
