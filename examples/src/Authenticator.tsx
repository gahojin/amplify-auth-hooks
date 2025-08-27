import { AuthenticatorProvider, useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import SignIn from './components/SignIn'

const Router = () => {
  const { route, errorMessage } = useAuthenticator(({ route }) => [route])

  switch (route) {
    case 'signIn':
      return <SignIn />
    default:
      return null
  }
}

export default () => {
  return (
    <AuthenticatorProvider>
      <Router />
    </AuthenticatorProvider>
  )
}
