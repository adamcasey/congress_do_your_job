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
        Check your email for confirmation. We&apos;ll notify you when we launch.
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-row items-center gap-3"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
          className="h-12 w-48 rounded-full border border-slate-200 bg-white px-5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="h-12 w-72 rounded-full border border-slate-200 bg-white px-5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-full bg-slate-900 px-8 text-base font-semibold text-white shadow-lg shadow-slate-900/30 transition hover:-translate-y-[1px] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing up...' : 'Notify me'}
        </button>
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
