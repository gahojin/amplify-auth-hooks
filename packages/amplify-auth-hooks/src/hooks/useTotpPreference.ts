import {
  fetchMFAPreference as amplifyFetchMFAPreference,
  updateMFAPreference as amplifyUpdateMFAPreference,
  verifyTOTPSetup as amplifyVerifyTOTPSetup,
} from '@aws-amplify/auth'
import { useCallback, useEffect, useState } from 'react'
import type { UseTotpPreference, UseTotpPreferenceOptions, UseTotpPreferenceStatus } from '~/types/hooks.js'

const defaultOptions: Required<UseTotpPreferenceOptions> = {
  fetchMFAPreference: amplifyFetchMFAPreference,
  updateMFAPreference: amplifyUpdateMFAPreference,
  verifyTOTPSetup: amplifyVerifyTOTPSetup,
}

export function useTotpPreference(options?: UseTotpPreferenceOptions): UseTotpPreference {
  const { fetchMFAPreference, updateMFAPreference, verifyTOTPSetup } = { ...defaultOptions, ...options }
  const [enabled, setEnabled] = useState(false)
  const [status, setStatus] = useState<UseTotpPreferenceStatus>('loading')

  const reload = useCallback(async () => {
    setStatus('loading')
    try {
      const { enabled: list } = await fetchMFAPreference()
      setEnabled(!!list?.includes('TOTP'))
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }, [fetchMFAPreference])

  useEffect(() => void reload(), [reload])

  const disable = useCallback(async () => {
    setStatus('loading')
    try {
      await updateMFAPreference({ totp: 'DISABLED' })
      setEnabled(false)
      setStatus('idle')
    } catch (e) {
      setStatus('error')
      throw e
    }
  }, [updateMFAPreference])

  const verifyCode = useCallback(
    async (code: string) => {
      setStatus('loading')
      try {
        await verifyTOTPSetup({ code })
        await updateMFAPreference({ totp: 'PREFERRED' })
        setEnabled(true)
        setStatus('idle')
      } catch (e) {
        setStatus('error')
        throw e
      }
    },
    [verifyTOTPSetup, updateMFAPreference],
  )

  return { enabled, status, disable, verifyCode }
}
