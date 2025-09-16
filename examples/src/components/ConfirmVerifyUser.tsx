import { useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { useState } from 'react'
import ErrorMessage from './ErrorMessage'

const ConfirmVerifyUser = () => {
  const { isPending, codeDeliveryDetails, handleSubmit, skipAttributeVerification } = useAuthenticator(
    ({ isPending, codeDeliveryDetails, handleSubmit, skipAttributeVerification }) => [
      isPending,
      codeDeliveryDetails,
      handleSubmit,
      skipAttributeVerification,
    ],
  )
  const [confirmationCode, setConfirmationCode] = useState('')

  return (
    <form>
      {/* enterによる処理を防止 */}
      <input type="text" style={{ display: 'none' }} />
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
