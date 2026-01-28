import { NextRequest, NextResponse } from 'next/server'
import { resend } from '@/config'
import { WaitlistConfirmation } from '@/emails'

/**
 * Test endpoint for email templates
 * Only works in development environment
 *
 * Usage: POST /api/test/email with { "to": "your@email.com" }
 */

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint not available in production' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { to } = body

    if (!to) {
      return NextResponse.json(
        { error: 'Email address required. Send { "to": "your@email.com" }' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    console.log('[Test Email] Sending to:', to)

    const result = await resend.emails.send({
      from: 'CongressDoYourJob <no-reply@congressdoyourjob.com>',
      to,
      subject: "[TEST] You're on the list — Congress Do Your Job",
      html: WaitlistConfirmation({ email: to }),
    })

    console.log('[Test Email] Sent successfully:', result)

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      emailId: result.data?.id,
      to,
    })
  } catch (error) {
    console.error('[Test Email] Error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { error: 'Failed to send test email', details: errorMessage },
      { status: 500 }
    )
  }
}
