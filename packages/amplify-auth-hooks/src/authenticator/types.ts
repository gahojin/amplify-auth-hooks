import type { AuthUser } from '@aws-amplify/auth'
import type { HubCapsule } from '@aws-amplify/core'
import type { ActorRefFrom } from 'xstate'
import type { createAuthenticatorMachine } from '../machines'

export type AuthActor = ActorRefFrom<ReturnType<typeof createAuthenticatorMachine>>

export type AuthMachineHubHandlerOptions = {
  onSignIn?: (user: AuthUser) => void
  onSignOut?: () => void
}

export type AuthMachineHubHandler = (
  // biome-ignore lint/suspicious/noExplicitAny: ignore
  data: HubCapsule<any, any>,
  actor: AuthActor,
  options?: AuthMachineHubHandlerOptions,
) => void

export type StopListenerCallback = () => void
