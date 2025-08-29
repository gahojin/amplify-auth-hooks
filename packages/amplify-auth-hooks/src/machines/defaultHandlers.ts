import {
  autoSignIn,
  confirmResetPassword,
  confirmSignIn,
  confirmSignUp,
  confirmUserAttribute,
  fetchUserAttributes,
  getCurrentUser,
  resendSignUpCode,
  resetPassword,
  sendUserAttributeVerificationCode,
  signIn,
  signInWithRedirect,
  signOut,
  signUp,
} from '@aws-amplify/auth'
import type { Handlers } from './types'

export const defaultHandlers: Handlers = {
  getCurrentUser,
  fetchUserAttributes,
  signIn,
  signInWithRedirect,
  signUp,
  signOut,
  autoSignIn,
  confirmSignIn,
  confirmSignUp,
  confirmResetPassword,
  confirmUserAttribute,
  resetPassword,
  resendSignUpCode,
  sendUserAttributeVerificationCode,
}
