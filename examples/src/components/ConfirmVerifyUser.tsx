import { useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { useState } from 'react'
import ErrorMessage from './ErrorMessage'

const ConfirmVerifyUser = () => {
  const { isPending, handleSubmit, skipAttributeVerification } = useAuthenticator(({ isPending }) => [isPending])
  const [confirmationCode, setConfirmationCode] = useState('')

  return (
    <form>
      {/* enterによる処理を防止 */}
      <input type="text" style={{ display: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: '1em', width: '300px' }}>
        <label>
          code:
          <input
            type="text"
            name="confirmationCode"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            disabled={isPending}
          />
        </label>
        <button type="button" onClick={() => handleSubmit({ confirmationCode })} disabled={isPending}>
          confirm
        </button>
        <button type="button" onClick={() => skipAttributeVerification()} disabled={isPending}>
          skip
        </button>
        <ErrorMessage />
      </div>
    </form>
  )
}

export default ConfirmVerifyUser
