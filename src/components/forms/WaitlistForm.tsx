'use client'

import { useState, FormEvent } from 'react'
import { Input, Button, Alert } from '@/components/ui'

export function WaitlistForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      setSuccess(true)
      setName('')
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Alert variant="success" title="You're on the list!">
        Check your email for confirmation. We'll notify you when we launch.
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-col gap-3 md:flex-row md:items-center"
        onSubmit={handleSubmit}
      >
        <Input
          type="text"
          name="name"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
          className="md:w-48"
        />
        <Input
          type="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          error={!!error}
          className="md:w-64"
        />
        <Button type="submit" loading={loading}>
          {loading ? 'Signing up...' : 'Notify me'}
        </Button>
      </form>

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      <p className="text-sm text-slate-500">
        No spam. No third party data brokers. Only get notified once we go live.
      </p>
    </div>
  )
}
