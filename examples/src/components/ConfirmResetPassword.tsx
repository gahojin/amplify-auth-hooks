import { useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { useState } from 'react'
import ErrorMessage from './ErrorMessage'

const ConfirmResetPassword = () => {
  const { isPending, handleSubmit } = useAuthenticator(({ isPending, handleSubmit }) => [isPending, handleSubmit])
  const [confirmationCode, setConfirmationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')

  return (
    <form>
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
        <label>
          password:
          <input type="password" name="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isPending} />
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
