import { getTotpCodeURL, useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useState } from 'react'
import ErrorMessage from './ErrorMessage'

const SetupTotp = () => {
  const { isPending, totpSecretCode, username, handleSubmit, setRoute } = useAuthenticator(({ isPending, totpSecretCode, username }) => [
    isPending,
    totpSecretCode,
    username,
  ])
  const [totpIssuer, setTotpIssuer] = useState('AWSCognito')
  const [totpUsername, setTotpUserName] = useState('')
  const [qrcode, setQrcode] = useState<string | null>(null)
  const [confirmationCode, setConfirmationCode] = useState('')

  const generateQrCode = useCallback(() => {
    if (!totpSecretCode) {
      return
    }
    const totpCode = getTotpCodeURL(totpIssuer, totpUsername, totpSecretCode)
    setQrcode(totpCode)
  }, [totpIssuer, totpUsername, totpSecretCode])

  useEffect(() => {
    generateQrCode()
  }, [generateQrCode])

  useEffect(() => {
    if (username) {
      setTotpUserName(username)
    }
  }, [username])

  return (
    <form>
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: '1em', width: '300px' }}>
        <p>totpSecretCode: {totpSecretCode}</p>
        <label>
          issuer:
          <input
            type="text"
            name="totpIssuer"
            value={totpIssuer}
            onChange={(e) => setTotpIssuer(e.target.value)}
            disabled={isPending}
            autoComplete="off"
          />
        </label>
        <label>
          username:
          <input
            type="text"
            name="totpUsername"
            value={totpUsername}
            onChange={(e) => setTotpUserName(e.target.value)}
            disabled={isPending}
            autoComplete="username"
          />
        </label>
        {qrcode && <QRCodeSVG value={qrcode} />}

        <label>
          code:
          <input
            type="text"
            name="code"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            disabled={isPending}
            autoComplete="off"
          />
        </label>
        <button type="button" onClick={() => handleSubmit({ challengeResponse: confirmationCode })} disabled={isPending}>
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

export default SetupTotp
