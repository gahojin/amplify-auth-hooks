import { useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'

const ErrorMessage = () => {
  const { errorMessage } = useAuthenticator(({ errorMessage }) => [errorMessage])

  return <p>error: {errorMessage}</p>
}

export default ErrorMessage
