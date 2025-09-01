import { type AuthMFAType, useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import type {} from 'aws-amplify/auth'
import { useEffect, useState } from 'react'
import ErrorMessage from './ErrorMessage'

const SelectMfaType = () => {
  const { isPending, allowedMfaTypes, handleSubmit } = useAuthenticator(({ isPending, allowedMfaTypes, handleSubmit }) => [
    isPending,
    allowedMfaTypes,
    handleSubmit,
  ])
  const [selectMfaType, setSelectMfaType] = useState<AuthMFAType>()

  useEffect(() => {
    if (allowedMfaTypes && allowedMfaTypes.length > 0) {
      setSelectMfaType(allowedMfaTypes[0])
    }
  }, [allowedMfaTypes])

  return (
    <form>
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: '1em', width: '300px' }}>
        {allowedMfaTypes?.map((type) => (
          <label key={type}>
            {type}
            <input type="radio" name="userAttributeKey" value="email" checked={selectMfaType === type} onChange={() => setSelectMfaType(type)} />
          </label>
        ))}
        <button type="button" onClick={() => handleSubmit({ challengeResponse: selectMfaType })} disabled={isPending}>
          select
        </button>
        <ErrorMessage />
      </div>
    </form>
  )
}

export default SelectMfaType
