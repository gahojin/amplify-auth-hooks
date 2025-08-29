import { useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { useState } from 'react'
import ErrorMessage from './ErrorMessage'

const VerifyUser = () => {
  const { isPending, handleSubmit, skipAttributeVerification, unverifiedUserAttributes } = useAuthenticator(
    ({ isPending, unverifiedUserAttributes }) => [isPending, unverifiedUserAttributes],
  )

  const [userAttributeKey, setUserAttributeKey] = useState(() => {
    if (unverifiedUserAttributes?.email) {
      return 'email'
    }
    if (unverifiedUserAttributes?.phone_number) {
      return 'phone_number'
    }
    return ''
  })

  return (
    <form>
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: '1em', width: '300px' }}>
        {unverifiedUserAttributes?.email && (
          <label>
            verify email:
            <input
              type="radio"
              name="userAttributeKey"
              value="email"
              checked={userAttributeKey === 'email'}
              onChange={() => setUserAttributeKey('email')}
            />
          </label>
        )}
        {unverifiedUserAttributes?.phone_number && (
          <label>
            verify phone_number:
            <input
              type="radio"
              name="userAttributeKey"
              value="phone_number"
              checked={userAttributeKey === 'phone_number'}
              onChange={() => setUserAttributeKey('phone_number')}
            />
          </label>
        )}
        <button type="button" onClick={() => handleSubmit({ userAttributeKey })} disabled={isPending}>
          send
        </button>
        <button type="button" onClick={() => skipAttributeVerification()} disabled={isPending}>
          skip
        </button>
        <ErrorMessage />
      </div>
    </form>
  )
}

export default VerifyUser
