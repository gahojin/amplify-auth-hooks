/*
 * Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * (C) 2025 GAHOJIN, Inc.
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 */

import type {
  AuthUser,
  ConfirmResetPasswordInput,
  ConfirmSignInInput,
  ConfirmSignInOutput,
  ConfirmSignUpInput,
  ConfirmSignUpOutput,
  ConfirmUserAttributeInput,
  FetchUserAttributesOutput,
  ResendSignUpCodeInput,
  ResendSignUpCodeOutput,
  ResetPasswordInput,
  ResetPasswordOutput,
  SendUserAttributeVerificationCodeInput,
  SendUserAttributeVerificationCodeOutput,
  SignInInput,
  SignInOutput,
  SignUpInput,
  SignUpOutput,
  UserAttributeKey,
} from '@aws-amplify/auth'
import type { AuthSignInWithRedirectInput, AuthSignOutInput } from 'node_modules/@aws-amplify/auth/dist/esm/types'
import type { AuthCodeDeliveryDetails, AutoSignInCallback } from 'node_modules/@aws-amplify/auth/dist/esm/types/models'

export type ChallengeName =
  | 'SMS_MFA'
  | 'SMS_OTP'
  | 'SOFTWARE_TOKEN_MFA'
  | 'EMAIL_OTP'
  | 'SELECT_MFA_TYPE'
  | 'SELECT_CHALLENGE'
  | 'MFA_SETUP'
  | 'PASSWORD'
  | 'PASSWORD_SRP'
  | 'PASSWORD_VERIFIER'
  | 'CUSTOM_CHALLENGE'
  | 'DEVICE_SRP_AUTH'
  | 'DEVICE_PASSWORD_VERIFIER'
  | 'ADMIN_NO_SRP_AUTH'
  | 'NEW_PASSWORD_REQUIRED'
  | 'WEB_AUTHN'

export type AuthMFAType = 'SMS' | 'TOTP' | 'EMAIL'

export type AuthTOTPSetupDetails = {
  sharedSecret: string
  getSetupUri: (appName: string, accountName?: string) => URL
}

export type InvokeActorEventTypes =
  | 'done.invoke.forgotPasswordActor'
  | 'done.invoke.signInActor'
  | 'done.invoke.signUpActor'
  | 'done.invoke.signOutActor'
  | 'done.invoke.verifyUserAttributesActor'

export type AuthEventTypes =
  | 'FEDERATED_SIGN_IN'
  | 'RESEND'
  | 'FORGOT_PASSWORD'
  | 'AUTO_SIGN_IN_FAILURE'
  | 'SIGN_IN_WITH_REDIRECT'
  | 'SIGN_IN'
  | 'SIGN_OUT'
  | 'SIGN_UP'
  | 'SUBMIT'
  | 'SKIP'
  | 'INIT'
  | 'TOKEN_REFRESH'
  | InvokeActorEventTypes

// biome-ignore lint/suspicious/noExplicitAny: イベントデータの型は定義出来ない
export type AuthEventData = Record<PropertyKey, any>

export type AuthEvent = {
  type: AuthEventTypes
  data?: AuthEventData
  input?: ActorDoneData
  output?: AuthEventData
  error?: Error
  actorId?: string
}

export type ActorDoneData = {
  challengeName?: ChallengeName
  codeDeliveryDetails?: AuthCodeDeliveryDetails<UserAttributeKey>
  missingAttributes?: string[]
  remoteError?: string
  step: Step
  totpSecretCode?: string
  username?: string
  unverifiedUserAttributes?: UnverifiedUserAttributes
  allowedMfaTypes?: AuthMFAType[]
}

export type AuthContext = {
  // biome-ignore lint/suspicious/noExplicitAny: actorの型を設定出来ない
  childRef?: any
  user?: AuthUser
  config?: {
    initialState?: 'signIn' | 'signUp' | 'forgotPassword'
  }
  // data returned from actors when they finish and reach their final state
  actorDoneData?: ActorDoneData
  hasSetup?: boolean
}

export type InitialStep = 'FORGOT_PASSWORD' | 'SIGN_IN' | 'SIGN_UP'

export type SignInStep =
  | 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE'
  | 'CONFIRM_SIGN_IN_WITH_SMS_CODE'
  | 'CONFIRM_SIGN_IN_WITH_TOTP_CODE'
  | 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
  | 'CONFIRM_SIGN_IN_WITH_PASSWORD'
  | 'CONFIRM_SIGN_UP'
  | 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP'
  | 'CONTINUE_SIGN_IN_WITH_EMAIL_SETUP'
  | 'CONTINUE_SIGN_IN_WITH_MFA_SETUP_SELECTION'
  | 'CONTINUE_SIGN_IN_WITH_MFA_SELECTION'
  | 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE'
  | 'CONTINUE_SIGN_IN_WITH_FIRST_FACTOR_SELECTION'
  | 'RESET_PASSWORD'
  | 'SIGN_IN_COMPLETE' // 'DONE'

export type ResetPasswordStep = 'CONFIRM_RESET_PASSWORD_WITH_CODE' | 'RESET_PASSWORD_COMPLETE' // 'DONE'

export type SignUpStep = 'CONFIRM_SIGN_UP' | 'COMPLETE_AUTO_SIGN_IN' | 'SIGN_UP_COMPLETE' // 'DONE'

export type UserAttributeStep = 'SHOULD_CONFIRM_USER_ATTRIBUTE' | 'CONFIRM_ATTRIBUTE_WITH_CODE' | 'CONFIRM_ATTRIBUTE_COMPLETE' // 'DONE'

export type Step = InitialStep | SignInStep | SignUpStep | ResetPasswordStep | UserAttributeStep

type BaseContext = {
  challengeName?: ChallengeName
  missingAttributes?: string[]
  remoteError?: string
  step: Step
  totpSecretCode?: string
  unverifiedUserAttributes?: UnverifiedUserAttributes
  allowedMfaTypes?: AuthMFAType[]

  // kept in memory for submission to relevnat APIs
  username?: string
  selectedUserAttribute?: string

  // retrieved from the Auth module on sign in,
  // cleared on sign out
  user?: AuthUser
}

export type ResetPasswordContext = BaseContext & ActorDoneData
export type SignInContext = BaseContext & ActorDoneData
export type SignUpContext = BaseContext & ActorDoneData
export type VerifyUserContext = BaseContext & ActorDoneData
export type SignOutContext = Pick<BaseContext, 'user'>

export type AuthActorContext = SignInContext | SignUpContext | ResetPasswordContext

export type Handlers = {
  getCurrentUser: () => Promise<AuthUser>
  fetchUserAttributes: () => Promise<FetchUserAttributesOutput>
  signIn: (input: SignInInput) => Promise<SignInOutput>
  signInWithRedirect: (input?: AuthSignInWithRedirectInput) => Promise<void>
  signUp: (input: SignUpInput) => Promise<SignUpOutput>
  signOut: (input?: AuthSignOutInput) => Promise<void>
  autoSignIn: AutoSignInCallback
  confirmSignIn: (input: ConfirmSignInInput) => Promise<ConfirmSignInOutput>
  confirmSignUp: (input: ConfirmSignUpInput) => Promise<ConfirmSignUpOutput>
  confirmResetPassword: (input: ConfirmResetPasswordInput) => Promise<void>
  confirmUserAttribute: (input: ConfirmUserAttributeInput) => Promise<void>
  resetPassword: (input: ResetPasswordInput) => Promise<ResetPasswordOutput>
  resendSignUpCode: (input: ResendSignUpCodeInput) => Promise<ResendSignUpCodeOutput>
  sendUserAttributeVerificationCode: (input: SendUserAttributeVerificationCodeInput) => Promise<SendUserAttributeVerificationCodeOutput>
}

export type UnverifiedUserAttributes = {
  email?: string
  phone_number?: string
}
