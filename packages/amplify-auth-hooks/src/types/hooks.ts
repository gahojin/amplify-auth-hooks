import type { AuthUser, CodeDeliveryDetails, fetchMFAPreference, updateMFAPreference, verifyTOTPSetup } from '@aws-amplify/auth'
import type { UnverifiedUserAttributes } from '~/types/user.js'
import type { AuthAllowedMFATypes, AuthEventData, NavigableRoute } from './machines.js'

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

export type UseTotpPreferenceStatus = 'loading' | 'idle' | 'error'

export type UseTotpPreferenceOptions = {
  fetchMFAPreference?: typeof fetchMFAPreference
  updateMFAPreference?: typeof updateMFAPreference
  verifyTOTPSetup?: typeof verifyTOTPSetup
}

export type UseTotpPreference = {
  enabled: boolean
  status: UseTotpPreferenceStatus
  disable: () => Promise<void>
  verifyCode: (code: string) => Promise<void>
}
