import { LoaderCircle } from 'lucide-react'

type LoaderProps = {
  label?: string
}

export default function Loader({ label = 'Loading...' }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-10 text-center">
      <LoaderCircle className="h-6 w-6 animate-spin text-slate-500" />
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  )
}
