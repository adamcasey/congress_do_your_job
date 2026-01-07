import { Resend } from 'resend'
import { getEnvValue } from './env'

const API_KEY = getEnvValue({
  development: process.env.RESEND_API_KEY_DEV,
  production: process.env.RESEND_API_KEY,
})

if (!API_KEY) {
  throw new Error('Resend API key not found for current environment')
}

export const resend = new Resend(API_KEY)
