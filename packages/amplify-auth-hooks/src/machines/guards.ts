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

import type { FetchUserAttributesOutput, ResetPasswordOutput, SignInOutput, SignUpOutput } from '@aws-amplify/auth'
import type { AuthEvent, ResetPasswordContext, Step } from './types'

const SIGN_IN_STEP_MFA_CONFIRMATION: Step[] = ['CONFIRM_SIGN_IN_WITH_SMS_CODE', 'CONFIRM_SIGN_IN_WITH_TOTP_CODE', 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE']

export const shouldConfirmSignInWithNewPassword = (event: AuthEvent): boolean => {
  const output = event.output as SignInOutput
  return output?.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
}

export const shouldResetPasswordFromSignIn = (event: AuthEvent): boolean => {
  const output = event.output as SignInOutput
  return output?.nextStep?.signInStep === 'RESET_PASSWORD'
}

export const shouldConfirmSignUpFromSignIn = (event: AuthEvent): boolean => {
  const output = event.output as SignInOutput
  return output?.nextStep?.signInStep === 'CONFIRM_SIGN_UP'
}

export const shouldAutoSignIn = (event: AuthEvent): boolean => {
  const output = event.output as SignUpOutput
  return output?.nextStep?.signUpStep === 'COMPLETE_AUTO_SIGN_IN'
}

export const hasCompletedSignIn = (event: AuthEvent): boolean => {
  const output = event.output as SignInOutput
  return output?.nextStep?.signInStep === 'DONE'
}

export const hasCompletedSignUp = (event: AuthEvent): boolean => {
  const output = event.output as SignUpOutput
  return output?.nextStep?.signUpStep === 'DONE'
}

export const hasCompletedResetPassword = (event: AuthEvent): boolean => {
  const output = event.output as ResetPasswordOutput
  return output?.nextStep?.resetPasswordStep === 'DONE'
}

export const hasCompletedAttributeConfirmation = (step: Step): boolean => {
  return step === 'CONFIRM_ATTRIBUTE_COMPLETE'
}

export const isConfirmUserAttributeStep = (step: Step): boolean => {
  return step === 'CONFIRM_ATTRIBUTE_WITH_CODE'
}

export const isShouldConfirmUserAttributeStep = (step: Step): boolean => {
  return step === 'SHOULD_CONFIRM_USER_ATTRIBUTE'
}

export const isResetPasswordStep = (step: Step): boolean => {
  return step === 'RESET_PASSWORD'
}

export const isConfirmSignUpStep = (step: Step): boolean => {
  return step === 'CONFIRM_SIGN_UP'
}

export const isShouldConfirmSignInWithNewPassword = (step: Step): boolean => {
  return step === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
}

export const shouldConfirmSignIn = (step: Step): boolean => {
  return SIGN_IN_STEP_MFA_CONFIRMATION.includes(step)
}

export const shouldSetupTotp = (step: Step): boolean => {
  return step === 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP'
}

export const shouldSetupEmail = (step: Step): boolean => {
  return step === 'CONTINUE_SIGN_IN_WITH_EMAIL_SETUP'
}

export const shouldSelectMfaType = (step: Step): boolean => {
  return ['CONTINUE_SIGN_IN_WITH_MFA_SELECTION', 'CONTINUE_SIGN_IN_WITH_MFA_SETUP_SELECTION'].includes(step)
}

export const shouldResetPassword = (context: ResetPasswordContext, event: AuthEvent): boolean => {
  const step = event?.input?.step ?? context.step
  return step === 'RESET_PASSWORD'
}

export const shouldConfirmResetPassword = (context: ResetPasswordContext, event: AuthEvent): boolean => {
  const step = event?.input?.step ?? context.step
  return step === 'CONFIRM_RESET_PASSWORD_WITH_CODE'
}

export const shouldVerifyAttribute = (event: AuthEvent): boolean => {
  const { email, phone_number, phone_number_verified, email_verified } = (event.output ?? {}) as FetchUserAttributesOutput

  // if neither email nor phone_number exist
  // there is nothing to verify
  if (!email && !phone_number) {
    return false
  }

  // email/phone_verified is returned as a string
  const emailVerified = email_verified === 'true'
  const phoneVerified = phone_number_verified === 'true'

  // only request verification if both email and phone are not verified
  return !emailVerified && !phoneVerified
}

export const isUserAlreadyConfirmed = (event: AuthEvent): boolean => {
  return event.error?.message === 'User is already confirmed.'
}
