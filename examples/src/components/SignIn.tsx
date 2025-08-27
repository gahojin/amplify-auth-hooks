import { useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { useState } from 'react'

const SignIn = () => {
  const { isPending, handleSubmit, errorMessage } = useAuthenticator(({ isPending, errorMessage }) => [isPending, errorMessage])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  return (
    <form>
      <input type="text" name="username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isPending} />
      <input type="text" name="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isPending} />
      <button type="button" onClick={() => handleSubmit({ username, password })} disabled={isPending}>
        signIn
      </button>
      {errorMessage}
    </form>
  )
}

export default SignIn
