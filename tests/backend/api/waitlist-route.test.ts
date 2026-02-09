import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/v1/waitlist/route'

const { getCollectionMock, sendEmailMock, waitlistTemplateMock } = vi.hoisted(() => ({
  getCollectionMock: vi.fn(),
  sendEmailMock: vi.fn(),
  waitlistTemplateMock: vi.fn(),
}))

vi.mock('@/lib/mongodb', () => ({
  getCollection: getCollectionMock,
}))

vi.mock('@/config', () => ({
  resend: {
    emails: {
      send: sendEmailMock,
    },
  },
}))

vi.mock('@/emails', () => ({
  WaitlistConfirmation: waitlistTemplateMock,
}))

function createRequest(body: unknown, headers?: Record<string, string>) {
  return {
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers(headers),
  } as any
}

describe('POST /api/v1/waitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    waitlistTemplateMock.mockReturnValue('<p>confirmed</p>')
  })

  it('returns 400 when email is missing', async () => {
    const response = await POST(createRequest({}))
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Email is required',
    })
  })

  it('returns 400 when email is invalid', async () => {
    const response = await POST(createRequest({ email: 'invalid' }))
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Please enter a valid email address',
    })
  })

  it('returns 409 when email already exists', async () => {
    getCollectionMock.mockResolvedValue({
      findOne: vi.fn().mockResolvedValue({ _id: '1' }),
    })

    const response = await POST(createRequest({ email: 'a@example.com' }))
    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'This email is already on the waitlist',
    })
  })

  it('creates signup and sends confirmation email', async () => {
    const findOne = vi.fn().mockResolvedValue(null)
    const insertOne = vi.fn().mockResolvedValue({ insertedId: '1' })
    getCollectionMock.mockResolvedValue({ findOne, insertOne })
    sendEmailMock.mockResolvedValue({ id: 'email-id' })

    const response = await POST(createRequest(
      { email: 'person@example.com' },
      {
        'x-forwarded-for': '203.0.113.5',
        'user-agent': 'vitest',
      }
    ))

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { message: 'Successfully added to waitlist' },
    })
    expect(findOne).toHaveBeenCalledWith({ email: 'person@example.com' })
    expect(insertOne).toHaveBeenCalledTimes(1)
    expect(waitlistTemplateMock).toHaveBeenCalledWith({ email: 'person@example.com' })
    expect(sendEmailMock).toHaveBeenCalledTimes(1)
  })

  it('still succeeds when email delivery fails', async () => {
    getCollectionMock.mockResolvedValue({
      findOne: vi.fn().mockResolvedValue(null),
      insertOne: vi.fn().mockResolvedValue({ insertedId: '1' }),
    })
    sendEmailMock.mockRejectedValue(new Error('smtp fail'))

    const response = await POST(createRequest({ email: 'person@example.com' }))
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { message: 'Successfully added to waitlist' },
    })
  })

  it('returns 503 on mongo connectivity errors', async () => {
    getCollectionMock.mockRejectedValue(new Error('Mongo network error'))
    const response = await POST(createRequest({ email: 'person@example.com' }))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Database connection error. Please try again later.',
    })
  })

  it('returns 500 on unexpected errors', async () => {
    getCollectionMock.mockRejectedValue(new Error('unexpected'))
    const response = await POST(createRequest({ email: 'person@example.com' }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Failed to sign up for waitlist. Please try again.',
    })
  })
})
