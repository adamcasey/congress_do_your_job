import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { WaitlistSignup } from '@/types/waitlist'
import { resend } from '@/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    const waitlistCollection = await getCollection<WaitlistSignup>('waitlist')

    const existingSignup = await waitlistCollection.findOne({ email })
    if (existingSignup) {
      return NextResponse.json(
        { error: 'This email is already on the waitlist' },
        { status: 409 }
      )
    }

    const signup: WaitlistSignup = {
      email,
      signedUpAt: new Date(),
      confirmed: true,
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    }

    await waitlistCollection.insertOne(signup as any)

    try {
      await resend.emails.send({
        from: 'CongressDoYourJob <no-reply@congressdoyourjob.com>',
        to: email,
        subject: "You're on the list!",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">You're on the list!</h1>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 12px;">
              Thanks for your interest in CongressDoYourJob.com. We'll notify you as soon as we launch.
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              No spam. No third party data brokers. Just a one-time notification when we go live.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              <strong>Less theater. More legislation.</strong><br/>
              CongressDoYourJob.com
            </p>
          </div>
        `,
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
    }

    return NextResponse.json(
      { message: 'Successfully added to waitlist' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Waitlist signup error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isDatabaseError = errorMessage.includes('Mongo') || errorMessage.includes('connect')

    if (isDatabaseError) {
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to sign up for waitlist. Please try again.' },
      { status: 500 }
    )
  }
}
