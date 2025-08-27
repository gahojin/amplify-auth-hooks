import type {
  CodeDeliveryDetails,
  FetchUserAttributesOutput,
  ResetPasswordOutput,
  SendUserAttributeVerificationCodeOutput,
  SignInOutput,
  SignUpOutput,
  UserAttributeKey,
} from '@aws-amplify/auth'
import type { AuthAllowedMFATypes } from 'node_modules/@aws-amplify/auth/dist/esm/types'
import type {
  ActorDoneData,
  AuthEvent,
  AuthTOTPSetupDetails,
  ChallengeName,
  ResetPasswordStep,
  SignInStep,
  SignUpStep,
  Step,
  UnverifiedUserAttributes,
} from './types'

type ActionParams<Context = unknown> = {
  context: Context
  event: AuthEvent
}

export const setTotpSecretCode = ({ event }: ActionParams): string => {
  const { sharedSecret } = (event.data?.nextStep?.totpSetupDetails ?? {}) as AuthTOTPSetupDetails
  return sharedSecret
}

export const setAllowedMfaTypes = ({ event }: ActionParams): AuthAllowedMFATypes | undefined => {
  return event.data?.nextStep?.allowedMFATypes
}

export const setSignInStep = (): Step => {
  return 'SIGN_IN'
}

export const setShouldVerifyUserAttributeStep = (): Step => {
  return 'SHOULD_CONFIRM_USER_ATTRIBUTE'
}

export const setConfirmAttributeCompleteStep = (): Step => {
  return 'CONFIRM_ATTRIBUTE_COMPLETE'
}

export const setChallengeName = ({ event }: ActionParams): ChallengeName | undefined => {
  const data = event.data as SignInOutput
  const signInStep = data?.nextStep?.signInStep

  switch (signInStep) {
    case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
      return 'SMS_MFA'
    case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
      return 'SOFTWARE_TOKEN_MFA'
    case 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE':
      return 'EMAIL_OTP'
    case 'CONTINUE_SIGN_IN_WITH_MFA_SETUP_SELECTION':
    case 'CONTINUE_SIGN_IN_WITH_EMAIL_SETUP':
    case 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP':
      return 'MFA_SETUP'
    case 'CONTINUE_SIGN_IN_WITH_MFA_SELECTION':
      return 'SELECT_MFA_TYPE'
    default:
      return undefined
  }
}

export const setNextSignInStep = ({ event }: ActionParams): SignInStep => {
  const data = (event.output ?? {}) as SignInOutput
  return data.nextStep?.signInStep === 'DONE' ? 'SIGN_IN_COMPLETE' : data.nextStep?.signInStep
}

export const setNextSignUpStep = ({ event }: ActionParams): SignUpStep => {
  const data = (event.output ?? {}) as SignUpOutput
  return data.nextStep?.signUpStep === 'DONE' ? 'SIGN_UP_COMPLETE' : data.nextStep?.signUpStep
}

export const setNextResetPasswordStep = ({ event }: ActionParams): ResetPasswordStep => {
  const data = (event.output ?? {}) as ResetPasswordOutput
  return data.nextStep?.resetPasswordStep === 'DONE' ? 'RESET_PASSWORD_COMPLETE' : data.nextStep?.resetPasswordStep
}

export const setActorDoneData = ({ event }: ActionParams): ActorDoneData => {
  const data = event.output ?? {}
  return {
    challengeName: data.challengeName,
    missingAttributes: data.missingAttributes,
    remoteError: data.remoteError,
    username: data.username,
    step: data.step,
    totpSecretCode: data.totpSecretCode,
  }
}

export const setCodeDeliveryDetails = ({ event }: ActionParams): CodeDeliveryDetails<UserAttributeKey> => {
  const output = event.output
  if (output?.nextStep?.codeDeliveryDetails) {
    return output?.nextStep?.codeDeliveryDetails
  }
  return output as CodeDeliveryDetails<UserAttributeKey>
}

export const setUnverifiedUserAttributes = ({ event }: ActionParams): UnverifiedUserAttributes => {
  const { email, phone_number } = event.output as FetchUserAttributesOutput

  const unverifiedUserAttributes = {
    ...(email && { email }),
    ...(phone_number && { phone_number }),
  }

  return unverifiedUserAttributes
}

export const setSelectedUserAttribute = ({ event }: ActionParams): string | undefined => {
  const output = event?.output as SendUserAttributeVerificationCodeOutput
  return output?.attributeName
}

export const setRemoteError = ({ event }: ActionParams): string => {
  const output = event.output
  if (output?.name === 'NoUserPoolError') {
    return 'Configuration error (see console) – please contact the administrator'
  }
  return output?.message || output
}
