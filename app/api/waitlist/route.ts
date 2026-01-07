import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { WaitlistSignup } from '@/types/waitlist'
import { resend } from '@/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
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
      name,
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
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1f2937;">Thanks for joining, ${name}!</h1>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
              We'll notify you as soon as CongressDoYourJob.com launches.
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
              No spam. No third party data brokers. Just a one-time notification when we go live.
            </p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
              Less theater. More legislation.<br/>
              — CongressDoYourJob.com
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
    return NextResponse.json(
      { error: 'Failed to sign up for waitlist' },
      { status: 500 }
    )
  }
}
