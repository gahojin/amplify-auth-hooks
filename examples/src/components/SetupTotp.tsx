import { getTotpCodeURL, useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { fetchUserAttributes, setUpTOTP, updateMFAPreference, verifyTOTPSetup } from 'aws-amplify/auth'
import { QRCodeSVG } from 'qrcode.react'
import { type PropsWithChildren, useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import ErrorMessage from './ErrorMessage'

const getUserEmail = async () => {
  try {
    const userAttributes = await fetchUserAttributes()
    return userAttributes.email
  } catch {
    return null
  }
}

type CommonProps = PropsWithChildren<{
  isPending: boolean
  issuer: string
  username: string
  secretCode: string
  verifyCode: (code: string) => void
}>

const Common = ({ isPending, issuer, username, secretCode, verifyCode, children }: CommonProps) => {
  const [totpIssuer, setTotpIssuer] = useState(issuer)
  const [totpUsername, setTotpUsername] = useState(username)
  const [confirmationCode, setConfirmationCode] = useState('')

  const qrCode = useMemo(() => {
    if (!totpIssuer || !totpUsername || !secretCode) {
      return null
    }
    return getTotpCodeURL(totpIssuer, totpUsername, secretCode)
  }, [totpIssuer, totpUsername, secretCode])

  return (
    <form>
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: '1em', width: '300px' }}>
        <p>totpSecretCode: {secretCode}</p>
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
            onChange={(e) => setTotpUsername(e.target.value)}
            disabled={isPending}
            autoComplete="username"
          />
        </label>
        {qrCode}
        {qrCode && <QRCodeSVG value={qrCode} />}

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
        <button type="button" onClick={() => verifyCode(confirmationCode)} disabled={isPending}>
          send
        </button>
        {children}
      </div>
    </form>
  )
}

export const SetupTOTPManual = () => {
  const [secretCode, setSecretCode] = useState('')
  const [username, setUsername] = useState('')
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    void setUpTOTP()
      .then((value) => setSecretCode(value.sharedSecret))
      .catch((err) => setErrorMessage(err.toString()))
  }, [])

  useEffect(() => {
    void getUserEmail().then((value) => setUsername(value ?? ''))
  }, [])

  const verifyCode = useCallback((code: string) => {
    startTransition(async () => {
      setErrorMessage('')
      try {
        await verifyTOTPSetup({ code })
        await updateMFAPreference({ totp: 'PREFERRED' })
      } catch (err: unknown) {
        setErrorMessage(`OTP code is invalid, or MFA preference update failed. ${err}`)
      }
    })
  }, [])

  return secretCode ? (
    <Common isPending={isPending} secretCode={secretCode} issuer="AWSCognito" username={username} verifyCode={verifyCode}>
      {errorMessage}
    </Common>
  ) : (
    (errorMessage ?? 'Loading...')
  )
}

export const SetupTotp = () => {
  const { isPending, totpSecretCode, handleSubmit, setRoute } = useAuthenticator(({ totpSecretCode }) => [totpSecretCode])
  const [username, setUsername] = useState('')

  useEffect(() => {
    void getUserEmail().then((value) => setUsername(value ?? ''))
  }, [])

  const verifyCode = useCallback((code: string) => {
    handleSubmit({ challengeResponse: code })
  }, [])

  return totpSecretCode ? (
    <Common isPending={isPending} secretCode={totpSecretCode} issuer="AWSCognito" username={username} verifyCode={verifyCode}>
      <button type="button" onClick={() => setRoute('signIn')} disabled={isPending}>
        signIn
      </button>
      <ErrorMessage />
    </Common>
  ) : (
    'Loading...'
  )
}
