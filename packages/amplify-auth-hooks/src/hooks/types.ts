import type { AuthUser, CodeDeliveryDetails } from '@aws-amplify/auth'
import type { AuthMFAType } from 'node_modules/@aws-amplify/auth/dist/esm/types'
import type { AuthEventData, NavigableRoute, UnverifiedUserAttributes } from '../machines/types'

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
  allowedMfaTypes: AuthMFAType[] | undefined
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
  toFederatedSignIn: (data?: AuthEventData) => void
  handleSubmit: (data?: AuthEventData) => void
  resendConfirmationCode: () => void
  setRoute: (route: NavigableRoute) => void
  skipAttributeVerification: () => void
}

export type AuthenticatorServiceFacade = AuthenticatorSendEventAliases & AuthenticatorServiceContextFacade

export type Comparator = (currentMachineContext: AuthenticatorMachineContext, nextMachineContext: AuthenticatorMachineContext) => boolean
