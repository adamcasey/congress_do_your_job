interface EmptyStateProps {
  title?: string
  message: string
  icon?: React.ReactNode
}

export function EmptyState({ title, message, icon }: EmptyStateProps) {
  return (
    <div className="rounded-lg bg-blue-50 border border-blue-200 p-6 text-center">
      {icon && (
        <div className="flex justify-center mb-3">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-base font-semibold text-blue-900 mb-2">
          {title}
        </h3>
      )}
      <p className="text-sm text-blue-700">
        {message}
      </p>
    </div>
  )
}
