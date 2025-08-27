import { Amplify } from 'aws-amplify'
import Authenticator from './Authenticator'

const _redirectUrl = process.env.VITE_COGNITO_REDIRECT_URL ?? ''

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.VITE_COGNITO_USER_POOL_ID ?? '',
      userPoolClientId: process.env.VITE_COGNITO_USER_POOL_CLIENT_ID ?? '',
    },
  },
})

const App = () => {
  return <Authenticator />
}

export default App
