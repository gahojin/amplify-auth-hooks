import { useSelector } from '@xstate/react'
import { useContext } from 'react'
import { AuthenticatorContext } from '../context'
import { getSendEventAliases, getServiceContextFacade } from './facade'
import type { UseAuthenticator, UseAuthenticatorSelector } from './types'
import { getComparator } from './utils'

const defaultComparator = (): false => false

export const useAuthenticator = (selector?: UseAuthenticatorSelector): UseAuthenticator => {
  const context = useContext(AuthenticatorContext)

  if (!context) {
    throw new Error('`useAuthenticator` must be used inside an `AuthenticatorProvider`.')
  }

  const { actor } = context
  const { send } = actor

  const comparator = selector ? getComparator(selector) : defaultComparator

  return useSelector(
    actor,
    (snapshot) => ({
      ...getSendEventAliases(send),
      ...getServiceContextFacade(snapshot),
    }),
    comparator,
  )
}
