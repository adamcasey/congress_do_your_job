import { describe, expect, it } from 'vitest'
import { jsonError, jsonSuccess } from '@/lib/api-response'

describe('api-response helpers', () => {
  it('returns a success payload', async () => {
    const response = jsonSuccess({ hello: 'world' }, { status: 201 })
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { hello: 'world' },
    })
  })

  it('returns an error payload with default status', async () => {
    const response = jsonError('Boom')
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Boom',
    })
  })

  it('includes optional details and preserves extra init fields', async () => {
    const response = jsonError('Bad request', 400, { field: 'email' }, {
      headers: { 'x-test': '1' },
    })

    expect(response.status).toBe(400)
    expect(response.headers.get('x-test')).toBe('1')
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Bad request',
      details: { field: 'email' },
    })
  })
})
