import { useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'

const Example = () => {
  const { isPending, user, errorMessage, route } = useAuthenticator()

  return (
    <div>
      {isPending ? (
        'loading...'
      ) : (
        <p>
          Route: {route}
          <br />
          UserId: {user?.userId}
          <br />
          Error: {errorMessage}
        </p>
      )}
    </div>
  )
}

export default Example
