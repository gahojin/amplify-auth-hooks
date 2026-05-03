import { type Context, createContext } from 'react'
import type { AuthActor } from '~/types/authenticator.js'

type AuthenticatorContextType = {
  actor: AuthActor
}

export const AuthenticatorContext: Context<AuthenticatorContextType | null> = createContext<AuthenticatorContextType | null>(null)
