import { useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'

const Example = () => {
  const { isPending, user, errorMessage, route, setRoute } = useAuthenticator(({ isPending, user, errorMessage, route, setRoute }) => [
    isPending,
    user,
    errorMessage,
    route,
    setRoute,
  ])

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
          <br />
          <button type="button" onClick={() => setRoute('signOut')}>
            SignOut
          </button>
        </p>
      )}
    </div>
  )
}

export default Example
