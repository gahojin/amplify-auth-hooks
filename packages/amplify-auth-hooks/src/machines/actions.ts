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
  AuthMethod,
  AuthMFAType,
  AuthTOTPSetupDetails,
  ResetPasswordStep,
  SignInContext,
  SignInStep,
  SignUpContext,
  SignUpStep,
} from '~/types/machines'
import type { UnverifiedUserAttributes } from '~/types/user'

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

const setUnverifiedUserAttributes = ({ context, event }: ActionParams<SignInContext | SignUpContext>): UnverifiedUserAttributes => {
  const { email, phone_number } = event.output as FetchUserAttributesOutput
  // Use fetchedUserAttributes from context if data is not provided
  const attributes = event.output || context.fetchedUserAttributes
  if (!attributes) {
    return {}
  }

  return {
    ...(email && { email }),
    ...(phone_number && { phone_number }),
  }
}

const setSelectedUserAttribute = ({ event }: ActionParams): AuthVerifiableAttributeKey | undefined => {
  const output = event?.output as SendUserAttributeVerificationCodeOutput
  return output?.attributeName
}

const setSignInActorDoneData = ({ event }: ActionParams<SignInContext>): SignInContext => {
  const output = event?.output ?? {}
  return {
    codeDeliveryDetails: output.codeDeliveryDetails,
    missingAttributes: output.missingAttributes,
    remoteError: output.remoteError,
    username: output.username,
    step: output.step,
    totpSecretCode: output.totpSecretCode,
    unverifiedUserAttributes: output.unverifiedUserAttributes,
    allowedMfaTypes: output.allowedMfaTypes,
  }
}

// Passwordless actions
const setSelectedAuthMethod = ({ event }: ActionParams): AuthMethod | undefined => event.data?.method

const setFetchedUserAttributes = ({ event }: ActionParams): Record<string, unknown> => {
  return event.output as FetchUserAttributesOutput
}

const setHasExistingPasskeys = ({ event }: ActionParams): boolean => {
  return (event?.output as unknown as boolean) ?? false
}

export {
  setAllowedMfaTypes,
  setCodeDeliveryDetails,
  setFetchedUserAttributes,
  setHasExistingPasskeys,
  setMissingAttributes,
  setNextResetPasswordStep,
  setNextSignInStep,
  setNextSignUpStep,
  setRemoteError,
  setSelectedAuthMethod,
  setSelectedUserAttribute,
  setSignInActorDoneData,
  setTotpSecretCode,
  setUnverifiedUserAttributes,
  setUser,
  setUsername,
}
