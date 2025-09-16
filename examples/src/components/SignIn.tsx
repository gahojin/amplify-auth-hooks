import { useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { useState } from 'react'
import ErrorMessage from './ErrorMessage'

const SignIn = () => {
  const { isPending, handleSubmit, setRoute } = useAuthenticator(({ isPending, handleSubmit, setRoute }) => [isPending, handleSubmit, setRoute])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

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
            autoComplete="current-password"
          />
        </label>
        <button type="button" onClick={() => handleSubmit({ username, password })} disabled={isPending}>
          signIn
        </button>
        <button type="button" onClick={() => setRoute('signUp')} disabled={isPending}>
          signUp
        </button>
        <button type="button" onClick={() => setRoute('forgotPassword')} disabled={isPending}>
          forgotPassword
        </button>
        <ErrorMessage />
      </div>
    </form>
  )
}

export default SignIn
