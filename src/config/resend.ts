import { Resend } from 'resend'
import { getEnvValue } from './env'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Resend')

let _resendClient: Resend | null = null

export function getResendClient(): Resend {
  if (_resendClient) return _resendClient

  logger.info('Environment configuration:', {
    nodeEnv: process.env.NODE_ENV,
    hasDevKey: !!process.env.RESEND_API_KEY_DEV,
    hasProductionKey: !!process.env.RESEND_API_KEY_PRODUCTION,
    devKeyPreview: process.env.RESEND_API_KEY_DEV ? `${process.env.RESEND_API_KEY_DEV.substring(0, 8)}...` : 'NONE',
    productionKeyPreview: process.env.RESEND_API_KEY_PRODUCTION ? `${process.env.RESEND_API_KEY_PRODUCTION.substring(0, 8)}...` : 'NONE',
  })

  const API_KEY = getEnvValue({
    development: process.env.RESEND_API_KEY_DEV,
    production: process.env.RESEND_API_KEY_PRODUCTION,
  })

  if (!API_KEY) {
    logger.error('Failed to get API key. Selected value:', API_KEY)
    throw new Error('Resend API key not found for current environment')
  }

  logger.info('Successfully initialized client')
  _resendClient = new Resend(API_KEY)
  return _resendClient
}

// For backwards compatibility
export const resend = {
  get emails() {
    return getResendClient().emails
  }
}
