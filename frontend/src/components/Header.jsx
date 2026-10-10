import { FileText, Sparkles, Circle } from "lucide-react";

export default function Header() {
  return (
    <header className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-600 shadow-sm">
            <FileText size={22} strokeWidth={2} className="text-white" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">AI-Powered Document Assistant</h1>
              <Sparkles size={16} className="shrink-0 text-teal-600" />
            </div>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Intelligent document Q&A</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-2.5 py-2">
          <Circle size={8} fill="currentColor" className="text-teal-600" />
          <span className="text-xs font-medium text-teal-700">System Online</span>
        </div>
      </div>
    </header>
  );
}
