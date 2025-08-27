import { type Context, createContext } from 'react'
import type { AuthActor } from '../authenticator/types'
import type { AuthStatus } from '../context/types'

type AuthenticatorContextType = {
  actor: AuthActor
  authStatus: AuthStatus
}

export const AuthenticatorContext: Context<AuthenticatorContextType | null> = createContext<AuthenticatorContextType | null>(null)
