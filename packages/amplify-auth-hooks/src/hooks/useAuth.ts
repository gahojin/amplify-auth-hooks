/*
 * Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * (C) 2025 GAHOJIN, Inc.
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 */

import { type AuthUser, getCurrentUser } from '@aws-amplify/auth'
import { Hub, type HubCallback } from '@aws-amplify/core'
import { useCallback, useEffect, useState } from 'react'
import type { Handlers } from '../machines/types'

export type UseAuthResult = {
  user?: AuthUser
  isLoading: boolean
  error?: Error
}

type Props = {
  getCurrentUser?: Handlers['getCurrentUser']
}

export const useAuth = ({ getCurrentUser: overrideGetCurrentUser }: Props): UseAuthResult => {
  const [result, setResult] = useState<UseAuthResult>({
    isLoading: true,
  })

  const fetchCurrentUser = useCallback(async () => {
    // loading
    setResult((prev) => ({ ...prev, isLoading: true }))

    try {
      const user = await (overrideGetCurrentUser ?? getCurrentUser)()
      setResult({ user, isLoading: false })
    } catch (e) {
      setResult({ error: e as Error, isLoading: false })
    }
  }, [overrideGetCurrentUser])

  const handleAuth: HubCallback = useCallback(
    ({ payload }) => {
      switch (payload.event) {
        // success events
        case 'signedIn':
        case 'signUp':
        case 'autoSignIn':
          setResult({ user: payload.data as AuthUser, isLoading: false })
          break
        case 'signedOut':
          setResult({ isLoading: false })
          break

        // failure events
        case 'tokenRefresh_failure':
        case 'signIn_failure':
          setResult({ error: payload.data as Error, isLoading: false })
          break
        case 'autoSignIn_failure':
          // autoSignIn just returns error message. Wrap it to an Error object
          setResult({ error: new Error(payload.message), isLoading: false })
          break

        // events that need another fetch
        case 'tokenRefresh':
          fetchCurrentUser()
          break

        default:
          // we do not handle other hub events like `configured`.
          break
      }
    },
    [fetchCurrentUser],
  )

  useEffect(() => {
    const unsubscribe = Hub.listen('auth', handleAuth, 'useAuth')
    fetchCurrentUser() // on init, see if user is already logged in

    return unsubscribe
  }, [handleAuth, fetchCurrentUser])

  return result
}
