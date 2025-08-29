import { useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { useState } from 'react'
import ErrorMessage from './ErrorMessage'

const SignUp = () => {
  const { isPending, handleSubmit, setRoute } = useAuthenticator(({ isPending }) => [isPending])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  return (
    <form>
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: '1em', width: '300px' }}>
        <label>
          username: <input type="text" name="username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isPending} />
        </label>
        <label>
          password: <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isPending} />
        </label>
        <button type="button" onClick={() => handleSubmit({ username, password })} disabled={isPending}>
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
