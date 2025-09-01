import { AuthenticatorProvider, useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { useCallback } from 'react'
import ConfirmResetPassword from './components/ConfirmResetPassword'
import ConfirmSignIn from './components/ConfirmSignIn'
import ConfirmSignUp from './components/ConfirmSignUp'
import ConfirmVerifyUser from './components/ConfirmVerifyUser'
import ForceNewPassword from './components/ForceNewPassword'
import ForgotPassword from './components/ForgotPassword'
import SetupTotp from './components/SetupTotp'
import SignIn from './components/SignIn'
import SignUp from './components/SignUp'
import VerifyUser from './components/VerifyUser'
import Example from './Example'

const Router = () => {
  const { route } = useAuthenticator(({ route }) => [route])

  switch (route) {
    case 'authenticated':
    case 'idle':
    case 'setup':
    case 'transition':
    case 'signOut':
      return <Example />
    case 'confirmSignUp':
      return <ConfirmSignUp />
    case 'confirmSignIn':
      return <ConfirmSignIn />
    case 'selectMfaType':
      //   return <SelectMfaType />
      return <>{route}</>
    case 'setupEmail':
      //   return <SetupEmail />
      return <>{route}</>
    case 'setupTotp':
      return <SetupTotp />
    case 'signIn':
      return <SignIn />
    case 'signUp':
      return <SignUp />
    case 'forceNewPassword':
      return <ForceNewPassword />
    case 'forgotPassword':
      return <ForgotPassword />
    case 'confirmResetPassword':
      return <ConfirmResetPassword />
    case 'verifyUser':
      return <VerifyUser />
    case 'confirmVerifyUser':
      return <ConfirmVerifyUser />
    default:
      return <>{route}</>
  }
}

export default () => {
  const onSignIn = useCallback(() => {
    console.log('signIn')
  }, [])

  const onSignOut = useCallback(() => {
    console.log('signOut')
  }, [])

  return (
    <AuthenticatorProvider options={{ onSignIn, onSignOut }}>
      <Router />
    </AuthenticatorProvider>
  )
}
