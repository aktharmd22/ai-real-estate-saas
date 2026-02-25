export default function Spinner({ size = 20 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin"
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Spinner size={36} />
        <p className="text-sm text-slate-400 font-medium">Loading...</p>
      </div>
    </div>
  )
}