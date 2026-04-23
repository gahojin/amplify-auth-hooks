import type { AuthUser, CodeDeliveryDetails } from '@aws-amplify/auth'
import type { UnverifiedUserAttributes } from '~/types/user'
import type { AuthAllowedMFATypes, AuthEventData, NavigableRoute } from './machines'

export type AuthenticatorRoute =
  | 'authenticated'
  | 'confirmResetPassword'
  | 'confirmSignIn'
  | 'confirmSignUp'
  | 'confirmVerifyUser'
  | 'forceNewPassword'
  | 'idle'
  | 'forgotPassword'
  | 'setup'
  | 'signOut'
  | 'selectMfaType'
  | 'setupEmail'
  | 'setupTotp'
  | 'signIn'
  | 'signUp'
  | 'transition'
  | 'verifyUser'

type AuthenticatorMachineContext = AuthenticatorServiceFacade
type AuthenticatorMachineContextKey = keyof AuthenticatorMachineContext

export type UseAuthenticatorSelector = (context: AuthenticatorServiceFacade) => AuthenticatorMachineContext[AuthenticatorMachineContextKey][]

export type UseAuthenticator = AuthenticatorServiceFacade

export type AuthenticatorServiceContextFacade = {
  allowedMfaTypes?: AuthAllowedMFATypes
  codeDeliveryDetails?: CodeDeliveryDetails
  errorMessage?: string
  isPending: boolean
  route: AuthenticatorRoute | null
  totpSecretCode?: string
  username?: string
  user?: AuthUser
  unverifiedUserAttributes?: UnverifiedUserAttributes
}

export type AuthenticatorSendEventAliases = {
  handleSubmit: (data?: AuthEventData) => void
  resendConfirmationCode: () => void
  refreshUser: () => void
  setRoute: (route: NavigableRoute) => void
  skipAttributeVerification: () => void
  toFederatedSignIn: (data?: AuthEventData) => void
}

export type AuthenticatorServiceFacade = AuthenticatorSendEventAliases & AuthenticatorServiceContextFacade

export type Comparator = (currentMachineContext: AuthenticatorMachineContext, nextMachineContext: AuthenticatorMachineContext) => boolean
