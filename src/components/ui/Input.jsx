import clsx from 'clsx'

export default function Input({
  label,
  error,
  icon,
  className,
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-slate-700">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          className={clsx(
            'w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-slate-900',
            'placeholder:text-slate-400 outline-none transition-all duration-150',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            error ? 'border-red-400' : 'border-slate-200 hover:border-slate-300',
            icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}