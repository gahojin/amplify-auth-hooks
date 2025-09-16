import { useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { useCallback, useState } from 'react'
import ErrorMessage from './ErrorMessage'

const SignUp = () => {
  const { isPending, handleSubmit, setRoute } = useAuthenticator(({ isPending, handleSubmit, setRoute }) => [isPending, handleSubmit, setRoute])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [autoSignIn, setAutoSignIn] = useState(true)

  const handleSignUp = useCallback(() => {
    handleSubmit({
      username,
      password,
      options: autoSignIn ? { autoSignIn: true } : {},
    })
  }, [handleSubmit, username, password, autoSignIn])

  return (
    <form>
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: '1em', width: '300px' }}>
        <label>
          username:
          <input
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isPending}
            autoComplete="username"
          />
        </label>
        <label>
          password:
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            autoComplete="new-password"
          />
        </label>
        <label>
          Auto SignUp
          <input type="checkbox" checked={autoSignIn} onChange={(e) => setAutoSignIn(e.target.checked)} />
        </label>
        <button type="button" onClick={() => handleSignUp()} disabled={isPending}>
          sign up
        </button>
        <button type="button" onClick={() => setRoute('signIn')} disabled={isPending}>
          signIn
        </button>
        <ErrorMessage />
      </div>
    </form>
  )
}

export default SignUp
