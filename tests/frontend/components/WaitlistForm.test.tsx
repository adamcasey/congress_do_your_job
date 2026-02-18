import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WaitlistForm } from '@/components/forms/WaitlistForm'

const { useWaitlistSignupMock } = vi.hoisted(() => ({
  useWaitlistSignupMock: vi.fn(),
}))

vi.mock('@/hooks', () => ({
  useWaitlistSignup: useWaitlistSignupMock,
}))

describe('WaitlistForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useWaitlistSignupMock.mockReturnValue({
      loading: false,
      success: false,
      error: '',
      submitEmail: vi.fn().mockResolvedValue(undefined),
    })
  })

  it('shows success state when signup succeeded', () => {
    useWaitlistSignupMock.mockReturnValue({
      loading: false,
      success: true,
      error: '',
      submitEmail: vi.fn(),
    })

    render(<WaitlistForm />)
    expect(screen.getByText("You're on the list!")).toBeInTheDocument()
  })

  it('validates email input before submit', async () => {
    const user = userEvent.setup()
    const submitEmail = vi.fn().mockResolvedValue(undefined)
    useWaitlistSignupMock.mockReturnValue({
      loading: false,
      success: false,
      error: '',
      submitEmail,
    })

    render(<WaitlistForm />)

    const input = screen.getByPlaceholderText('Enter your email')
    await user.type(input, 'bad-email')
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()

    fireEvent.submit(input.closest('form')!)
    expect(submitEmail).not.toHaveBeenCalled()
  })

  it('submits valid emails and clears input', async () => {
    const user = userEvent.setup()
    const submitEmail = vi.fn().mockResolvedValue(undefined)
    useWaitlistSignupMock.mockReturnValue({
      loading: false,
      success: false,
      error: '',
      submitEmail,
    })

    render(<WaitlistForm />)

    const input = screen.getByPlaceholderText('Enter your email')
    await user.type(input, 'person@example.com')
    fireEvent.submit(input.closest('form')!)

    expect(submitEmail).toHaveBeenCalledWith('person@example.com')
    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })

  it('renders server error messages', () => {
    useWaitlistSignupMock.mockReturnValue({
      loading: false,
      success: false,
      error: 'Something went wrong',
      submitEmail: vi.fn(),
    })

    render(<WaitlistForm />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})
