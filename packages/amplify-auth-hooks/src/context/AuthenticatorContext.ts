import { type Context, createContext } from 'react'
import type { AuthActor } from '../authenticator/types'

type AuthenticatorContextType = {
  actor: AuthActor
}

export const AuthenticatorContext: Context<AuthenticatorContextType | null> = createContext<AuthenticatorContextType | null>(null)
