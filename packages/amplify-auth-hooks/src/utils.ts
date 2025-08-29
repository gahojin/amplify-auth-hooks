export const getTotpCodeURL = (issuer: string, username: string, secret: string): string => {
  return encodeURI(`otpauth://totp/${issuer}:${username}?secret=${secret}&issuer=${issuer}`)
}
