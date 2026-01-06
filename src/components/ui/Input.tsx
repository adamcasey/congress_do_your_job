import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    const baseStyles = 'h-12 w-full rounded-full border bg-white px-5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed'
    const normalStyles = 'border-slate-200 focus:border-amber-300 focus:ring-amber-200'
    const errorStyles = 'border-red-300 focus:border-red-400 focus:ring-red-200'

    return (
      <input
        ref={ref}
        className={`${baseStyles} ${error ? errorStyles : normalStyles} ${className}`}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
