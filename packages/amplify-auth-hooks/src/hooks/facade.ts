import type { AnyMachineSnapshot, SnapshotFrom } from 'xstate'
import type { AuthActor } from '../authenticator/types'
import type { AuthActorContext, AuthEvent, AuthEventTypes, NavigableRoute } from '../machines/types'
import type { AuthenticatorRoute, AuthenticatorSendEventAliases, AuthenticatorServiceContextFacade } from './types'

const NAVIGABLE_ROUTE_EVENT: Record<NavigableRoute, AuthEventTypes> = {
  forgotPassword: 'FORGOT_PASSWORD',
  signIn: 'SIGN_IN',
  signUp: 'SIGN_UP',
  signOut: 'SIGN_OUT',
}

export const getSendEventAliases = (send: (event: AuthEvent) => void): AuthenticatorSendEventAliases => {
  return {
    handleSubmit: (data) => send({ type: 'SUBMIT', data }),
    resendConfirmationCode: () => send({ type: 'RESEND' }),
    setRoute: (route) => send({ type: NAVIGABLE_ROUTE_EVENT[route] }),
    skipAttributeVerification: () => send({ type: 'SKIP' }),
    toFederatedSignIn: () => send({ type: 'FEDERATED_SIGN_IN' }),
  }
}

const getChildActor = (snapshot: SnapshotFrom<AuthActor>): AnyMachineSnapshot | undefined => {
  return snapshot.children?.childActor?.getSnapshot() as AnyMachineSnapshot
}

const getRoute = (actor: SnapshotFrom<AuthActor>, childActor: AnyMachineSnapshot | undefined): AuthenticatorRoute | null => {
  // 'federatedSignIn' exists as a state on both the 'signInActor' and 'signUpActor',
  // match against the `actorState` initially to determine if the federated sign in flow
  // has begun, then which actor has begun the flow and return the corresponding `route`
  if (childActor?.matches('federatedSignIn')) {
    if (actor.matches('signUpActor')) {
      return 'signUp'
    }
    if (actor.matches('signInActor')) {
      return 'signIn'
    }
  }

  switch (true) {
    case actor.matches('idle'):
      return 'idle'
    case actor.matches('setup'):
      return 'setup'
    case actor.matches('signOut'):
      return 'signOut'
    case actor.matches('authenticated'):
      return 'authenticated'
    case childActor?.matches('confirmSignUp'):
    case childActor?.matches('resendSignUpCode'):
      return 'confirmSignUp'
    case childActor?.matches('confirmSignIn'):
      return 'confirmSignIn'
    case childActor?.matches('setupTotp.edit'):
    case childActor?.matches('setupTotp.submit'):
      return 'setupTotp'
    case childActor?.matches('signIn'):
      return 'signIn'
    case childActor?.matches('signUp'):
    case childActor?.matches('autoSignIn'):
      return 'signUp'
    case childActor?.matches('forceChangePassword'):
      return 'forceNewPassword'
    case childActor?.matches('forgotPassword'):
      return 'forgotPassword'
    case childActor?.matches('confirmResetPassword'):
      return 'confirmResetPassword'
    case childActor?.matches('selectUserAttributes'):
      return 'verifyUser'
    case childActor?.matches('confirmVerifyUserAttribute'):
      return 'confirmVerifyUser'
    case childActor?.matches('setupEmail'):
      return 'setupEmail'
    case childActor?.matches('selectMfaType'):
      return 'selectMfaType'
    case actor.matches('getCurrentUser'):
    case childActor?.matches('fetchUserAttributes'):
      /**
       * This route is needed for autoSignIn to capture both the
       * autoSignIn.pending and the resolved states when the
       * signIn actor is running.
       */
      return 'transition'
    default:
      return null
  }
}

export const getServiceContextFacade = (actor: SnapshotFrom<AuthActor>): AuthenticatorServiceContextFacade => {
  const childActor = getChildActor(actor)
  const isPending = (actor.hasTag('pending') || childActor?.hasTag('pending')) ?? false
  const route = getRoute(actor, childActor)
  const context = actor.context
  const actorContext: AuthActorContext = childActor?.context ?? {}
  const user = actorContext?.user ?? context.user

  const { allowedMfaTypes, codeDeliveryDetails, remoteError: errorMessage, totpSecretCode, unverifiedUserAttributes, username } = actorContext

  return {
    allowedMfaTypes,
    codeDeliveryDetails,
    errorMessage,
    isPending,
    route,
    totpSecretCode,
    unverifiedUserAttributes,
    user,
    username,
  }
}
