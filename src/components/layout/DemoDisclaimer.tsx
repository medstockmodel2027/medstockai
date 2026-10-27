import React from 'react'
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export const DemoDisclaimer: React.FC = () => {
  const { triggerSalesSync, isSyncingSales, resetToMockData } = useApp()

  return (
    <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-slate-200 px-4 py-2.5 border-b border-emerald-900/40 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase tracking-wider border border-emerald-500/30 shrink-0">
            <Sparkles className="w-3 h-3" />
            Phase 1 Demo
          </span>
          <span className="text-slate-300">
            <strong>Demonstration Mode:</strong> Operating on simulated Marg ERP POS billing feeds and synthetic batch metadata. Predictions & reorders are AI simulation previews.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => triggerSalesSync()}
            disabled={isSyncingSales}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 transition-all font-medium text-[11px] disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncingSales ? 'animate-spin' : ''}`} />
            {isSyncingSales ? 'Syncing POS...' : 'Simulate POS Sync'}
          </button>
          <button
            onClick={resetToMockData}
            title="Reset dataset"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
