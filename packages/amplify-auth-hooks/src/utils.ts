export const getTotpCodeURL = (issuer: string, username: string, secret: string): string => {
  const encodedIssuer = encodeURIComponent(issuer)
  const encodedUsername = encodeURIComponent(username)
  const encodedSecret = encodeURIComponent(secret)

  return `otpauth://totp/${encodedIssuer}:${encodedUsername}?secret=${encodedSecret}&issuer=${encodedIssuer}`
}
