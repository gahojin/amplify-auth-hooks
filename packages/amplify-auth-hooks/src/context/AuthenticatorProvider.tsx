import { useActor } from '@xstate/react'
import { type JSX, type PropsWithChildren, useContext, useEffect, useMemo } from 'react'
import { defaultAuthHubHandler, listenToAuthHub } from '../authenticator/defaultAuthHubHandler'
import type { AuthMachineHubHandler, AuthMachineHubHandlerOptions } from '../authenticator/types'
import { AuthenticatorContext } from '../context/AuthenticatorContext'
import { type AuthenticatorMachineOptions, createAuthenticatorMachine } from '../machines'

const createHubHandler = (options?: AuthMachineHubHandlerOptions): AuthMachineHubHandler => {
  return (data, service) => defaultAuthHubHandler(data, service, options)
}

type Props = PropsWithChildren & {
  options?: AuthenticatorMachineOptions
}

export default ({ options, children }: Props): JSX.Element => {
  const machine = useMemo(() => createAuthenticatorMachine(options), [options])

  // 階層構造にAuthenticatorContextを使用している場合、親Contextの認証状態を継承する
  const parentProvider = useContext(AuthenticatorContext)
  const [, , actor] = useActor(machine)
  const value = useMemo(() => parentProvider ?? { actor }, [parentProvider, actor])

  const { actor: activeActor } = value

  useEffect(() => {
    return listenToAuthHub(activeActor, createHubHandler(options))
  }, [activeActor, options])

  return <AuthenticatorContext.Provider value={value}>{children}</AuthenticatorContext.Provider>
}
