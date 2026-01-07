export interface WaitlistSignup {
  name: string
  email: string
  signedUpAt: Date
  confirmed: boolean
  confirmationToken?: string
  ipAddress?: string
  userAgent?: string
}
