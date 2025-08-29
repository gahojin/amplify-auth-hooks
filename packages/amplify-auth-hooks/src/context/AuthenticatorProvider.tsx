import { useActor } from '@xstate/react'
import { type JSX, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'
import { defaultAuthHubHandler, listenToAuthHub } from '../authenticator/defaultAuthHubHandler'
import type { AuthMachineHubHandler } from '../authenticator/types'
import { AuthenticatorContext } from '../context/AuthenticatorContext'
import type { AuthStatus } from '../context/types'
import { type AuthenticatorMachineOptions, createAuthenticatorMachine } from '../machines'

type Options = Parameters<AuthMachineHubHandler>[2]

const createHubHandler = (options?: Options): AuthMachineHubHandler => {
  return (data, service) => defaultAuthHubHandler(data, service, options)
}

type Props = PropsWithChildren & {
  options?: AuthenticatorMachineOptions
}

export default ({ options, children }: Props): JSX.Element => {
  const machine = useMemo(() => createAuthenticatorMachine(options), [options])
  const [authStatus, setAuthStatus] = useState<AuthStatus>('configuring')

  // 階層構造にAuthenticatorContextを使用している場合、親Contextの認証状態を継承する
  const parentProvider = useContext(AuthenticatorContext)
  const [, , actor] = useActor(machine)
  const value = useMemo(() => parentProvider ?? { authStatus, actor }, [authStatus, parentProvider, actor])

  const { actor: activeActor } = value

  useEffect(() => {
    const onSignIn = () => setAuthStatus('authenticated')
    const onSignOut = () => setAuthStatus('unauthenticated')
    return listenToAuthHub(activeActor, createHubHandler({ onSignIn, onSignOut }))
  }, [activeActor])

  return <AuthenticatorContext.Provider value={value}>{children}</AuthenticatorContext.Provider>
}
