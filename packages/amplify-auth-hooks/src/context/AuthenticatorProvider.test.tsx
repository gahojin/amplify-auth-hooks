import { describe } from 'vitest'
import { useAuthenticator } from '../hooks/useAuthenticator'

const _TestComponent = () => {
  const { route } = useAuthenticator()
}

describe('AuthenticatorProvider', () => {})
