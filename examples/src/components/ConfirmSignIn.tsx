import { useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { useState } from 'react'
import ErrorMessage from './ErrorMessage'

const ConfirmSignIn = () => {
  const { isPending, username, handleSubmit, setRoute } = useAuthenticator(({ isPending, username }) => [isPending, username])
  const [confirmationCode, setConfirmationCode] = useState('')

  return (
    <form>
      {/* enterによる処理を防止 */}
      <input type="text" style={{ display: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: '1em', width: '300px' }}>
        <p>username: {username}</p>
        <label>
          code:
          <input
            type="text"
            name="confirmationCode"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            disabled={isPending}
            autoComplete="off"
          />
        </label>
        <button type="button" onClick={() => handleSubmit({ challengeResponse: confirmationCode })} disabled={isPending}>
          confirm
        </button>
        <button type="button" onClick={() => setRoute('signIn')} disabled={isPending}>
          signIn
        </button>
        <ErrorMessage />
      </div>
    </form>
  )
}

export default ConfirmSignIn
