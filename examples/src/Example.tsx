import { useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { fetchAuthSession } from 'aws-amplify/auth'
import { useCallback, useState } from 'react'

const Example = () => {
  const { isPending, user, errorMessage, route, setRoute } = useAuthenticator(({ isPending, user, errorMessage, route, setRoute }) => [
    isPending,
    user,
    errorMessage,
    route,
    setRoute,
  ])
  const [token, setToken] = useState<string>()

  const onFetchToken = useCallback(() => {
    if (!user) {
      setToken(undefined)
    }
    fetchAuthSession().then(({ tokens }) => {
      setToken(tokens?.accessToken?.toString())
    })
  }, [user])

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
          Token: {token}
          <br />
          <button type="button" onClick={() => onFetchToken()}>
            fetch token
          </button>
          <button type="button" onClick={() => setRoute('signOut')}>
            SignOut
          </button>
        </p>
      )}
    </div>
  )
}

export default Example
