import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { Search, Pill, ShieldAlert, FileText, ArrowRight, X } from 'lucide-react'
import { NavigationPage } from '../../types'

export const GlobalSearchModal: React.FC = () => {
  const {
    isGlobalSearchOpen,
    setIsGlobalSearchOpen,
    medicines,
    batches,
    purchaseInvoices,
    setCurrentPage,
    setSearchQuery: setGlobalSearchFilter,
  } = useApp()

  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsGlobalSearchOpen(true)
      }
      if (e.key === 'Escape' && isGlobalSearchOpen) {
        setIsGlobalSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isGlobalSearchOpen, setIsGlobalSearchOpen])

  useEffect(() => {
    if (isGlobalSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [isGlobalSearchOpen])

  if (!isGlobalSearchOpen) return null

  const cleanQuery = query.toLowerCase().trim()

  const matchedMedicines = cleanQuery
    ? medicines.filter(
        (m) =>
          m.name.toLowerCase().includes(cleanQuery) ||
          m.genericName.toLowerCase().includes(cleanQuery) ||
          m.category.toLowerCase().includes(cleanQuery)
      ).slice(0, 5)
    : medicines.slice(0, 4)

  const matchedBatches = cleanQuery
    ? batches.filter(
        (b) =>
          b.batchNumber.toLowerCase().includes(cleanQuery) ||
          b.medicineName.toLowerCase().includes(cleanQuery)
      ).slice(0, 4)
    : []

  const matchedInvoices = cleanQuery
    ? purchaseInvoices.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(cleanQuery) ||
          inv.distributorName.toLowerCase().includes(cleanQuery)
      ).slice(0, 3)
    : []

  const handleSelectMedicine = (name: string) => {
    setGlobalSearchFilter(name)
    setCurrentPage('inventory')
    setIsGlobalSearchOpen(false)
  }

  const handleNavigate = (page: NavigationPage) => {
    setCurrentPage(page)
    setIsGlobalSearchOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsGlobalSearchOpen(false)}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-xl z-10 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search medicines, generic salt, batch number, or invoices..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-hidden bg-transparent"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              ESC
            </span>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {/* Quick Page Jump */}
          {!query && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                Quick Navigation
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { name: 'Dashboard Analytics', page: 'dashboard' as NavigationPage },
                  { name: 'Master Inventory', page: 'inventory' as NavigationPage },
                  { name: 'Demand Forecast Model', page: 'demand-forecast' as NavigationPage },
                  { name: 'Purchase Recommendations', page: 'purchase-recommendations' as NavigationPage },
                  { name: 'Risk & Expiry Center', page: 'risk-center' as NavigationPage },
                  { name: 'Purchase Bill Imports', page: 'purchase-imports' as NavigationPage },
                ].map((item) => (
                  <button
                    key={item.page}
                    onClick={() => handleNavigate(item.page)}
                    className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl transition-colors text-left"
                  >
                    <span>{item.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Medicines */}
          {matchedMedicines.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center justify-between">
                <span>Medicines ({matchedMedicines.length})</span>
                <span className="text-[10px] text-emerald-600">Click to filter inventory</span>
              </div>
              <div className="space-y-1">
                {matchedMedicines.map((med) => (
                  <div
                    key={med.id}
                    onClick={() => handleSelectMedicine(med.name)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {med.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {med.genericName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold font-mono text-slate-800">
                        {med.totalStock} {med.unit.split(' ')[0]}
                      </div>
                      <div className="text-[10px] text-slate-500">{med.category}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Batches */}
          {matchedBatches.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                Batches ({matchedBatches.length})
              </div>
              <div className="space-y-1">
                {matchedBatches.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => handleNavigate('risk-center')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold font-mono text-slate-900">
                          {b.batchNumber}
                        </div>
                        <div className="text-[11px] text-slate-500">{b.medicineName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Exp: {b.expiryDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {matchedInvoices.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                Purchase Invoices ({matchedInvoices.length})
              </div>
              <div className="space-y-1">
                {matchedInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => handleNavigate('purchase-imports')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 font-mono">
                          {inv.invoiceNumber}
                        </div>
                        <div className="text-[11px] text-slate-500">{inv.distributorName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 font-mono">
                        ₹{inv.totalAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">{inv.invoiceDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {query && matchedMedicines.length === 0 && matchedBatches.length === 0 && matchedInvoices.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              No medicines, batches, or invoices matching &quot;{query}&quot; found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Use <strong>↑</strong> <strong>↓</strong> to navigate</span>
          <span>Press <strong>ESC</strong> to dismiss</span>
        </div>
      </div>
    </div>
  )
}
