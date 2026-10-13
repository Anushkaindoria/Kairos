export default function Page({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="text-slate-500 mt-1">{subtitle}</p>
    </div>
  )
}