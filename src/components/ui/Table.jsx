import clsx from 'clsx'

export function Table({ children, className }) {
  return (
    <div className={clsx('overflow-x-auto rounded-xl border border-slate-200', className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function TableHead({ children }) {
  return (
    <thead className="bg-slate-50 border-b border-slate-200">
      <tr>{children}</tr>
    </thead>
  )
}

export function TableHeader({ children, className }) {
  return (
    <th className={clsx(
      'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide',
      className
    )}>
      {children}
    </th>
  )
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>
}

export function TableRow({ children, onClick, className }) {
  return (
    <tr
      onClick={onClick}
      className={clsx(
        'bg-white hover:bg-slate-50 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </tr>
  )
}

export function TableCell({ children, className }) {
  return (
    <td className={clsx('px-4 py-3.5 text-slate-700', className)}>
      {children}
    </td>
  )
}

export function TableEmpty({ message = 'No data found', colSpan = 6 }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-16 text-center">
        <div className="text-3xl mb-3">📭</div>
        <div className="text-sm text-slate-400 font-medium">{message}</div>
      </td>
    </tr>
  )
}