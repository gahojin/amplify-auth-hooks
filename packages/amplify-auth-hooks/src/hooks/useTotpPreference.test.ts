//

import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTotpPreference } from './useTotpPreference.js'

describe('useTotpPreference', () => {
  const fetchMFAPreference = vi.fn()
  const updateMFAPreference = vi.fn()
  const verifyTOTPSetup = vi.fn()

  const renderTotpPreference = () => renderHook(() => useTotpPreference({ verifyTOTPSetup, fetchMFAPreference, updateMFAPreference }))

  beforeEach(() => {
    vi.clearAllMocks()
    fetchMFAPreference.mockResolvedValue({ enabled: [] })
    updateMFAPreference.mockResolvedValue(undefined)
    verifyTOTPSetup.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('初期ロード', () => {
    it('マウント直後はloading状態になる', () => {
      fetchMFAPreference.mockReturnValue(new Promise(() => {})) // pendingのまま保留
      const { result } = renderTotpPreference()
      expect(result.current.status).toBe('loading')
    })

    it('enabledにTOTPが含まれていればenabled=trueになる', async () => {
      fetchMFAPreference.mockResolvedValue({ enabled: ['TOTP'] })
      const { result } = renderTotpPreference()
      await waitFor(() => expect(result.current.status).toBe('idle'))
      expect(result.current.enabled).toBe(true)
    })

    it('TOTPが含まれていなければenabled=falseになる', async () => {
      fetchMFAPreference.mockResolvedValue({ enabled: ['SMS'] })
      const { result } = renderTotpPreference()
      await waitFor(() => expect(result.current.status).toBe('idle'))
      expect(result.current.enabled).toBe(false)
    })

    it('enabledがundefinedでも落ちない', async () => {
      fetchMFAPreference.mockResolvedValue({})
      const { result } = renderTotpPreference()
      await waitFor(() => expect(result.current.status).toBe('idle'))
      expect(result.current.enabled).toBe(false)
    })

    it('fetchMFAPreferenceが失敗したらstatusがerrorになる', async () => {
      fetchMFAPreference.mockRejectedValue(new Error('network error'))
      const { result } = renderTotpPreference()
      await waitFor(() => expect(result.current.status).toBe('error'))
    })
  })

  describe('disable', () => {
    it('成功時: DISABLEDで呼ばれ、enabledがfalseになる', async () => {
      fetchMFAPreference.mockResolvedValue({ enabled: ['TOTP'] })
      const { result } = renderTotpPreference()
      await waitFor(() => expect(result.current.status).toBe('idle'))

      await act(async () => {
        await result.current.disable()
      })

      expect(updateMFAPreference).toHaveBeenCalledWith({ totp: 'DISABLED' })
      expect(result.current.enabled).toBe(false)
      expect(result.current.status).toBe('idle')
    })

    it('失敗時: statusがerrorになり、呼び出し元にrejectされる', async () => {
      fetchMFAPreference.mockResolvedValue({ enabled: ['TOTP'] })
      updateMFAPreference.mockRejectedValue(new Error('update failed'))
      const { result } = renderTotpPreference()
      await waitFor(() => expect(result.current.status).toBe('idle'))

      await act(async () => {
        await expect(result.current.disable()).rejects.toThrow('update failed')
      })
      expect(result.current.status).toBe('error')
    })
  })

  describe('confirmSetup', () => {
    it('成功時: verifyTOTPSetup→updateMFAPreferenceの順で呼ばれ、enabledがtrueになる', async () => {
      const { result } = renderTotpPreference()
      await waitFor(() => expect(result.current.status).toEqual('idle'))

      await act(async () => {
        await result.current.verifyCode('123456')
      })

      expect(verifyTOTPSetup).toHaveBeenCalledWith({ code: '123456' })
      expect(updateMFAPreference).toHaveBeenCalledWith({ totp: 'PREFERRED' })
      expect(result.current.enabled).toEqual(true)
      expect(result.current.status).toEqual('idle')
    })

    it('verifyTOTPSetupが失敗したらupdateMFAPreferenceは呼ばれない', async () => {
      verifyTOTPSetup.mockRejectedValue(new Error('invalid code'))
      const { result } = renderTotpPreference()
      await waitFor(() => expect(result.current.status).toEqual('idle'))

      await act(async () => {
        await expect(result.current.verifyCode('000000')).rejects.toThrow('invalid code')
      })

      expect(updateMFAPreference).not.toHaveBeenCalled()
      expect(result.current.status).toEqual('error')
      expect(result.current.enabled).toEqual(false)
    })

    it('verifyTOTPSetup成功後にupdateMFAPreferenceが失敗したらstatusがerrorになる', async () => {
      updateMFAPreference.mockRejectedValue(new Error('update failed'))
      const { result } = renderTotpPreference()
      await waitFor(() => expect(result.current.status).toEqual('idle'))

      await act(async () => {
        await expect(result.current.verifyCode('123456')).rejects.toThrow('update failed')
      })

      expect(verifyTOTPSetup).toHaveBeenCalled()
      expect(result.current.status).toEqual('error')
    })
  })
})
