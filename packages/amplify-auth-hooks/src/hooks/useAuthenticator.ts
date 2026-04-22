import { useSelector } from '@xstate/react'
import { useContext } from 'react'
import { AuthenticatorContext } from '~/context'
import { getComparator } from '~/hooks/utils'
import type { UseAuthenticator, UseAuthenticatorSelector } from '~/types/hooks'
import { getSendEventAliases, getServiceContextFacade } from './facade'

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
