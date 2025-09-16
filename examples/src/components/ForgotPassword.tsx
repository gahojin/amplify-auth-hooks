import { useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { useState } from 'react'
import ErrorMessage from './ErrorMessage'

const ForgotPassword = () => {
  const { isPending, handleSubmit, setRoute } = useAuthenticator(({ isPending, handleSubmit, setRoute }) => [isPending, handleSubmit, setRoute])
  const [username, setUsername] = useState('')

  return (
    <form>
      {/* enterによる処理を防止 */}
      <input type="text" style={{ display: 'none' }} />
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
        <button type="button" onClick={() => handleSubmit({ username })} disabled={isPending}>
          send
        </button>
        <button type="button" onClick={() => setRoute('signIn')} disabled={isPending}>
          signIn
        </button>
        <ErrorMessage />
      </div>
    </form>
  )
}

export default ForgotPassword
