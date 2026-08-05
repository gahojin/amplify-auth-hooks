import {
  fetchMFAPreference as amplifyFetchMFAPreference,
  updateMFAPreference as amplifyUpdateMFAPreference,
  verifyTOTPSetup as amplifyVerifyTOTPSetup,
} from '@aws-amplify/auth'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { UseTotpPreference, UseTotpPreferenceOptions, UseTotpPreferenceStatus } from '~/types/hooks.js'

const defaultOptions: Required<UseTotpPreferenceOptions> = {
  fetchMFAPreference: amplifyFetchMFAPreference,
  updateMFAPreference: amplifyUpdateMFAPreference,
  verifyTOTPSetup: amplifyVerifyTOTPSetup,
}

type RunOptions<T> = {
  onSuccess: (result: T) => void
  onError?: (e: unknown) => void
  rethrow?: boolean
}

const useGuardedRequest = () => {
  const [status, setStatus] = useState<UseTotpPreferenceStatus>('loading')
  const generationRef = useRef(0)

  const run = useCallback(async <T>(task: () => Promise<T>, options: RunOptions<T>) => {
    const generation = ++generationRef.current
    setStatus('loading')
    try {
      const result = await task()
      if (generation !== generationRef.current) {
        // 後続の操作が行われたため、ステータス更新は行わない
        return
      }
      options.onSuccess(result)
      setStatus('idle')
    } catch (e) {
      options.onError?.(e)
      if (generation === generationRef.current) {
        // 後続の操作が行われていない場合のみ、ステータス更新する
        setStatus('error')
      }
      if (options.rethrow) {
        throw e
      }
    }
  }, [])

  return { status, run }
}

export function useTotpPreference(options?: UseTotpPreferenceOptions): UseTotpPreference {
  const { fetchMFAPreference, updateMFAPreference, verifyTOTPSetup } = { ...defaultOptions, ...options }
  const [enabled, setEnabled] = useState(false)
  const { status, run } = useGuardedRequest()

  const reload = useCallback(
    () => run(() => fetchMFAPreference(), { onSuccess: ({ enabled }) => setEnabled(!!enabled?.includes('TOTP')) }),
    [fetchMFAPreference, run],
  )

  const disable = useCallback(
    () => run(() => updateMFAPreference({ totp: 'DISABLED' }), { onSuccess: () => setEnabled(false), rethrow: true }),
    [updateMFAPreference, run],
  )

  const verifyCode = useCallback(
    (code: string) =>
      run(
        async () => {
          await verifyTOTPSetup({ code })
          await updateMFAPreference({ totp: 'PREFERRED' })
        },
        { onSuccess: () => setEnabled(true), rethrow: true },
      ),
    [verifyTOTPSetup, updateMFAPreference, run],
  )

  useEffect(() => void reload(), [reload])

  return { enabled, status, disable, verifyCode }
}
