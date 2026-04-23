import { type UnverifiedContactMethodType, UnverifiedContactMethodTypes, useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { useState } from 'react'
import ErrorMessage from './ErrorMessage'

const VerifyUser = () => {
  const { isPending, unverifiedUserAttributes, handleSubmit, skipAttributeVerification } = useAuthenticator(
    ({ isPending, unverifiedUserAttributes }) => [isPending, unverifiedUserAttributes],
  )
  const [selectUserAttributeKey, setSelectUserAttributeKey] = useState<UnverifiedContactMethodType | undefined>(() => {
    return UnverifiedContactMethodTypes.find((type) => !!unverifiedUserAttributes?.[type])
  })

  return (
    <form>
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: '1em', width: '300px' }}>
        {UnverifiedContactMethodTypes?.map((type) => (
          <label key={type}>
            verify {type}:
            <input
              type="radio"
              name="userAttributeKey"
              value={type}
              checked={selectUserAttributeKey === type}
              onChange={() => setSelectUserAttributeKey(type)}
            />
          </label>
        ))}
        <button type="button" onClick={() => handleSubmit({ userAttributeKey: selectUserAttributeKey })} disabled={isPending}>
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
