import clsx from 'clsx'

export default function Badge({ children, color = '#2563EB', bg = '#EFF6FF', className }) {
  return (
    <span
      className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', className)}
      style={{ color, backgroundColor: bg }}
    >
      {children}
    </span>
  )
}