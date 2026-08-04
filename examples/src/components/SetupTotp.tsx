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

  // Sync props to state after mount when local state is still empty
  useEffect(() => {
    if (issuer && !totpIssuer) {
      setTotpIssuer(issuer)
    }
  }, [issuer, totpIssuer])

  useEffect(() => {
    if (username && !totpUsername) {
      setTotpUsername(username)
    }
  }, [username, totpUsername])

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
  const [setupErrorMessage, setSetupErrorMessage] = useState('')
  const [verifyErrorMessage, setVerifyErrorMessage] = useState('')
  const [preferenceErrorMessage, setPreferenceErrorMessage] = useState('')

  const setupTotp = useCallback(() => {
    setSetupErrorMessage('')
    void setUpTOTP()
      .then((value) => setSecretCode(value.sharedSecret))
      .catch((err) => setSetupErrorMessage(err.toString()))
  }, [])

  useEffect(() => {
    setupTotp()
  }, [setupTotp])

  useEffect(() => {
    void getUserEmail().then((value) => setUsername(value ?? ''))
  }, [])

  const updatePreference = useCallback(async () => {
    setPreferenceErrorMessage('')
    try {
      await updateMFAPreference({ totp: 'PREFERRED' })
    } catch (err: unknown) {
      setPreferenceErrorMessage(`MFA preference update failed: ${err}`)
    }
  }, [])

  const verifyCode = useCallback((code: string) => {
    startTransition(async () => {
      setVerifyErrorMessage('')
      setPreferenceErrorMessage('')
      try {
        await verifyTOTPSetup({ code })
        await updatePreference()
      } catch (err: unknown) {
        setVerifyErrorMessage(`Invalid OTP code: ${err}`)
      }
    })
  }, [updatePreference])

  return secretCode ? (
    <Common isPending={isPending} secretCode={secretCode} issuer="AWSCognito" username={username} verifyCode={verifyCode}>
      {verifyErrorMessage && <div>{verifyErrorMessage}</div>}
      {preferenceErrorMessage && (
        <div>
          {preferenceErrorMessage}
          <button type="button" onClick={() => void updatePreference()} disabled={isPending}>
            Retry MFA Preference Update
          </button>
        </div>
      )}
    </Common>
  ) : (
    <div>
      {setupErrorMessage || 'Loading...'}
      {setupErrorMessage && (
        <button type="button" onClick={setupTotp}>
          Retry Setup
        </button>
      )}
    </div>
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
