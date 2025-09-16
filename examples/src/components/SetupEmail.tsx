import { useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { useState } from 'react'
import ErrorMessage from './ErrorMessage'

const SetupEmail = () => {
  const { isPending, handleSubmit, setRoute } = useAuthenticator(({ isPending, handleSubmit, setRoute }) => [isPending, handleSubmit, setRoute])
  const [email, setEmail] = useState('')

  return (
    <form>
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: '1em', width: '300px' }}>
        <label>
          email:
          <input type="text" name="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isPending} autoComplete="username" />
        </label>
        <button type="button" onClick={() => handleSubmit({ challengeResponse: email })} disabled={isPending}>
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

export default SetupEmail
