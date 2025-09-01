import type { AuthUser, CodeDeliveryDetails } from '@aws-amplify/auth'
import type { AuthAllowedMFATypes, AuthEventData, NavigableRoute, UnverifiedUserAttributes } from '../machines/types'

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
  allowedMfaTypes: AuthAllowedMFATypes | undefined
  codeDeliveryDetails: CodeDeliveryDetails | undefined
  errorMessage: string | undefined
  isPending: boolean
  route: AuthenticatorRoute | null
  totpSecretCode: string | undefined
  username: string | undefined
  user: AuthUser | undefined
  unverifiedUserAttributes: UnverifiedUserAttributes | undefined
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
