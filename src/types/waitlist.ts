export interface WaitlistSignup {
  email: string
  signedUpAt: Date
  confirmed: boolean
  confirmationToken?: string
  ipAddress?: string
  userAgent?: string
}
