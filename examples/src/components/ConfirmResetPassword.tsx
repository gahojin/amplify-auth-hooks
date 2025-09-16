import { useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { useState } from 'react'
import ErrorMessage from './ErrorMessage'

const ConfirmResetPassword = () => {
  const { isPending, codeDeliveryDetails, handleSubmit } = useAuthenticator(({ isPending, codeDeliveryDetails, handleSubmit }) => [
    isPending,
    codeDeliveryDetails,
    handleSubmit,
  ])
  const [confirmationCode, setConfirmationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')

  return (
    <form>
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: '1em', width: '300px' }}>
        <p>code delivery: {codeDeliveryDetails?.deliveryMedium}</p>
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
        <label>
          password:
          <input
            type="password"
            name="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isPending}
            autoComplete="new-password"
          />
        </label>
        <button type="button" onClick={() => handleSubmit({ confirmationCode, newPassword })} disabled={isPending}>
          change
        </button>
        <ErrorMessage />
      </div>
    </form>
  )
}

export default ConfirmResetPassword
