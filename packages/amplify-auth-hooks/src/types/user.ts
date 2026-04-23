/** Federated IDPs that Authenticator supports */
export const FederatedIdentityProviders = {
  Apple: 'Apple',
  Amazon: 'Amazon',
  Facebook: 'Facebook',
  Google: 'Google',
} as const
export type FederatedIdentityProviders = (typeof FederatedIdentityProviders)[keyof typeof FederatedIdentityProviders]

/**
 * Cognito user contact method types that have not been verified as valid
 */
export const UnverifiedContactMethodTypes = ['email', 'phone_number'] as const
export type UnverifiedContactMethodType = (typeof UnverifiedContactMethodTypes)[number]

export type UnverifiedUserAttributes = Partial<Record<UnverifiedContactMethodType, string>>
