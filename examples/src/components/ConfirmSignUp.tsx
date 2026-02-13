import { useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { useState } from 'react'
import ErrorMessage from './ErrorMessage'

const ConfirmSignUp = () => {
  const { isPending, username, codeDeliveryDetails, handleSubmit } = useAuthenticator(({ isPending, username, codeDeliveryDetails }) => [
    isPending,
    username,
    codeDeliveryDetails,
  ])
  const [confirmationCode, setConfirmationCode] = useState('')

  return (
    <form>
      {/* enterによる処理を防止 */}
      <input type="text" style={{ display: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: '1em', width: '300px' }}>
        <p>code delivery: {codeDeliveryDetails?.deliveryMedium}</p>
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
        <button type="button" onClick={() => handleSubmit({ confirmationCode })} disabled={isPending}>
          confirm
        </button>
        <ErrorMessage />
      </div>
    </form>
  )
}

export default ConfirmSignUp
