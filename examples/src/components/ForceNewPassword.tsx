import { useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { useState } from 'react'
import ErrorMessage from './ErrorMessage'

const ForceNewPassword = () => {
  const { isPending, handleSubmit } = useAuthenticator(({ isPending, handleSubmit }) => [isPending, handleSubmit])
  const [password, setPassword] = useState('')

  return (
    <form>
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: '1em', width: '300px' }}>
        <label>
          password: <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isPending} />
        </label>
        <button type="button" onClick={() => handleSubmit({ challengeResponse: password })} disabled={isPending}>
          change
        </button>
        <ErrorMessage />
      </div>
    </form>
  )
}

export default ForceNewPassword
