import { Resend } from 'resend'
import { getEnvValue } from './env'

let _resendClient: Resend | null = null

export function getResendClient(): Resend {
  if (_resendClient) return _resendClient

  const API_KEY = getEnvValue({
    development: process.env.RESEND_API_KEY_DEV,
    production: process.env.RESEND_API_KEY_PRODUCTION,
  })

  if (!API_KEY) {
    throw new Error('Resend API key not found for current environment')
  }

  _resendClient = new Resend(API_KEY)
  return _resendClient
}

// For backwards compatibility
export const resend = {
  get emails() {
    return getResendClient().emails
  }
}
