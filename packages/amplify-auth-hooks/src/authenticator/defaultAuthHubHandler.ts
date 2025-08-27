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

import { Hub } from '@aws-amplify/core'
import { AmplifyErrorCode } from '@aws-amplify/core/internals/utils'
import type { AuthActor, AuthMachineHubHandler, StopListenerCallback } from './types'

export const defaultAuthHubHandler: AuthMachineHubHandler = ({ payload }, actor, options) => {
  const { data, event } = payload
  const { send } = actor
  const { onSignIn, onSignOut } = options ?? {}

  switch (event) {
    case 'signedIn': {
      if (typeof onSignIn === 'function') {
        onSignIn(payload)
      }
      break
    }
    case 'signInWithRedirect': {
      send({ type: 'SIGN_IN_WITH_REDIRECT' })
      break
    }
    case 'signedOut': {
      if (typeof onSignOut === 'function') {
        onSignOut()
      }
      send({ type: 'SIGN_OUT' })
      break
    }
    case 'tokenRefresh_failure': {
      if (data?.error?.name === AmplifyErrorCode.NetworkError) {
        return
      }
      send({ type: 'SIGN_OUT' })
      break
    }
    default: {
      break
    }
  }
}

export const listenToAuthHub = (actor: AuthActor, handler: AuthMachineHubHandler = defaultAuthHubHandler): StopListenerCallback => {
  const eventHandler: Parameters<typeof Hub.listen>[1] = (data) => handler(data, actor)
  return Hub.listen('auth', eventHandler, 'authenticator-hub-handler')
}
