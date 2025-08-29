import type {
  CodeDeliveryDetails,
  FetchUserAttributesOutput,
  ResetPasswordOutput,
  SendUserAttributeVerificationCodeOutput,
  SignInOutput,
  SignUpOutput,
  UserAttributeKey,
} from '@aws-amplify/auth'
import type { AuthVerifiableAttributeKey } from '@aws-amplify/core/internals/utils'
import type {
  AuthEvent,
  AuthEventData,
  AuthMFAType,
  AuthTOTPSetupDetails,
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

const setTotpSecretCode = ({ event }: ActionParams): string | undefined => {
  const { sharedSecret } = (event.output?.nextStep?.totpSetupDetails ?? {}) as AuthTOTPSetupDetails
  return sharedSecret
}

const setAllowedMfaTypes = ({ event }: ActionParams): AuthMFAType[] | undefined => {
  return event.output?.nextStep?.allowedMFATypes as AuthMFAType[]
}

const setSignInStep: Step = 'SIGN_IN'

const setShouldVerifyUserAttributeStep: Step = 'SHOULD_CONFIRM_USER_ATTRIBUTE'

const setConfirmAttributeCompleteStep: Step = 'CONFIRM_ATTRIBUTE_COMPLETE'

const setConfirmSignUpStep: Step = 'CONFIRM_SIGN_UP'

const setNextSignInStep = ({ event }: ActionParams): SignInStep => {
  const output = (event.output ?? {}) as SignInOutput
  return output.nextStep?.signInStep === 'DONE' ? 'SIGN_IN_COMPLETE' : output.nextStep?.signInStep
}

const setNextSignUpStep = ({ event }: ActionParams): SignUpStep => {
  const output = (event.output ?? {}) as SignUpOutput
  return output.nextStep?.signUpStep === 'DONE' ? 'SIGN_UP_COMPLETE' : output.nextStep?.signUpStep
}

const setNextResetPasswordStep = ({ event }: ActionParams): ResetPasswordStep => {
  const output = (event.output ?? {}) as ResetPasswordOutput
  return output.nextStep?.resetPasswordStep === 'DONE' ? 'RESET_PASSWORD_COMPLETE' : output.nextStep?.resetPasswordStep
}

const setMissingAttributes = ({ event }: ActionParams): string | undefined => event.output?.nextStep?.missingAttributes

const setRemoteError = ({ event }: ActionParams): string => {
  const error = event.error
  if (error?.name === 'NoUserPoolError') {
    return 'Configuration error (see console) – please contact the administrator'
  }
  return error?.message || String(error)
}

const setUsername = ({ event }: ActionParams): string | undefined => event.data?.username

const setUser = ({ event }: ActionParams): AuthEventData | undefined => event.output

const setCodeDeliveryDetails = ({ event }: ActionParams): CodeDeliveryDetails<UserAttributeKey> => {
  const output = event.output
  if (output?.nextStep?.codeDeliveryDetails) {
    return output?.nextStep?.codeDeliveryDetails
  }
  return output as CodeDeliveryDetails<UserAttributeKey>
}

const setUnverifiedUserAttributes = ({ event }: ActionParams): UnverifiedUserAttributes => {
  const { email, phone_number } = event.output as FetchUserAttributesOutput

  const unverifiedUserAttributes = {
    ...(email && { email }),
    ...(phone_number && { phone_number }),
  }

  return unverifiedUserAttributes
}

const setSelectedUserAttribute = ({ event }: ActionParams): AuthVerifiableAttributeKey | undefined => {
  const output = event?.output as SendUserAttributeVerificationCodeOutput
  return output?.attributeName
}

export {
  setAllowedMfaTypes,
  setCodeDeliveryDetails,
  setMissingAttributes,
  setNextResetPasswordStep,
  setNextSignInStep,
  setNextSignUpStep,
  setRemoteError,
  setConfirmAttributeCompleteStep,
  setShouldVerifyUserAttributeStep,
  setSelectedUserAttribute,
  setSignInStep,
  setConfirmSignUpStep,
  setTotpSecretCode,
  setUsername,
  setUser,
  setUnverifiedUserAttributes,
}
