import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import type { SalesImportBatch } from '../../types'
import { Badge } from '../common/Badge'
import { Modal } from '../common/Modal'
import {
  Receipt,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from 'lucide-react'

export const SalesImportsPage: React.FC = () => {
  const {
    salesImports,
    triggerSalesSync,
    isSyncingSales,
    pharmacyProfile,
    addToast,
  } = useApp()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBatch, setSelectedBatch] = useState<SalesImportBatch | null>(null)
  const [isResolving, setIsResolving] = useState(false)

  const filteredBatches = salesImports.filter(
    (b) =>
      b.batchDate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleResolveDiscrepancy = (batch: SalesImportBatch) => {
    setIsResolving(true)
    setTimeout(() => {
      batch.status = 'Synced'
      batch.discrepancyNote = undefined
      setIsResolving(false)
      setSelectedBatch(null)
      addToast(
        'Discrepancy Cleared',
        'POS register reconciliation complete. Cancelled bill audited with register counter #2.',
        'success'
      )
    }, 800)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Retail Sales Bills & POS Data Ingestion
            </h2>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              Marg ERP Simulated Connector
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronizes retail customer bills from {pharmacyProfile.billingSoftware} to compute medicine depletion rates.
          </p>
        </div>

        <button
          onClick={() => triggerSalesSync()}
          disabled={isSyncingSales}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSales ? 'animate-spin' : ''}`} />
          {isSyncingSales ? 'Ingesting Marg ERP Feeds...' : 'Simulate POS Sync (Phase 1)'}
        </button>
      </div>

      {/* POS Synchronization Health Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Integrated Software
          </span>
          <div className="text-lg font-bold text-slate-900 mt-2 flex items-center gap-2">
            <span>{pharmacyProfile.billingSoftware}</span>
            <Badge variant="success" size="sm" dot>Connected</Badge>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Counter 1 & 2 Local DB Link
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Today&apos;s Retail Invoices
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {salesImports[0]?.billCount || 65} Bills
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
            Avg bill value: ₹540
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Units Dispensed Today
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {salesImports[0]?.unitsSold || 242} Packs
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Stock ledger auto-deducted
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Today&apos;s Gross Billing
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
            ₹{(salesImports[0]?.totalRevenue || 35100).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Tax collected: ₹{(salesImports[0]?.taxCollected || 4212).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Sales Ingestion Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by date, source, or sync status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 bg-slate-50/50"
            />
          </div>
          <div className="text-xs text-slate-500">
            Recorded <strong>{filteredBatches.length}</strong> daily billing sync sessions
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Sales Batch Date</th>
                <th className="py-3 px-3">Billing System</th>
                <th className="py-3 px-3">Import Timestamp</th>
                <th className="py-3 px-3">Customer Bills</th>
                <th className="py-3 px-3">Units Sold</th>
                <th className="py-3 px-3">Gross Sales</th>
                <th className="py-3 px-3">GST Collected</th>
                <th className="py-3 px-3">Sync Status</th>
                <th className="py-3 px-4 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatches.map((batch) => {
                const isFlagged = batch.status === 'Flagged Discrepancy'
                return (
                  <tr
                    key={batch.id}
                    className={`hover:bg-slate-50/70 transition-colors cursor-pointer group ${
                      isFlagged ? 'bg-rose-50/30' : ''
                    }`}
                    onClick={() => setSelectedBatch(batch)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-slate-400" />
                        {batch.batchDate}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Batch ID: {batch.id}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {batch.source}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {batch.importedAt}
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                      {batch.billCount} bills
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700">
                      {batch.unitsSold} packs
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <span className="font-bold text-sm text-slate-900">
                        ₹{batch.totalRevenue.toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-500">
                      ₹{batch.taxCollected.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-3">
                      <Badge
                        variant={isFlagged ? 'critical' : 'success'}
                        size="sm"
                        dot
                      >
                        {batch.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedBatch(batch)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-700 hover:text-emerald-800 hover:bg-slate-100 transition-colors"
                      >
                        {isFlagged ? 'Inspect Alert' : 'View'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Audit Modal */}
      {selectedBatch && (
        <Modal
          isOpen={!!selectedBatch}
          onClose={() => setSelectedBatch(null)}
          title={`Sales Ingestion Session: ${selectedBatch.batchDate}`}
          subtitle={`Source: ${selectedBatch.source} • Sync Reference: ${selectedBatch.id}`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-between w-full text-xs">
              <span className="text-slate-500 font-mono">Status: {selectedBatch.status}</span>
              <div className="flex items-center gap-2">
                {selectedBatch.status === 'Flagged Discrepancy' && (
                  <button
                    onClick={() => handleResolveDiscrepancy(selectedBatch)}
                    disabled={isResolving}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors disabled:opacity-50"
                  >
                    {isResolving ? 'Resolving...' : 'Approve Reconciliation'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Total Sales</span>
                <p className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                  ₹{selectedBatch.totalRevenue.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Transactions</span>
                <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                  {selectedBatch.billCount} retail bills
                </p>
              </div>
            </div>

            {selectedBatch.discrepancyNote ? (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Register Discrepancy Flagged</span>
                </div>
                <p className="text-xs leading-relaxed text-rose-800">
                  {selectedBatch.discrepancyNote}
                </p>
                <p className="text-[11px] text-rose-600 mt-1">
                  Ensure counter cash register settlement matches digital bills before confirming.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All bills balanced with inventory deduction ledger. No discrepancies detected.</span>
              </div>
            )}

            <div className="text-[11px] text-slate-500 space-y-1 border-t border-slate-100 pt-3">
              <p>• Data received via local Marg ERP file watcher socket port 8089.</p>
              <p>• Daily velocity calculations updated for all {selectedBatch.unitsSold} units dispensed.</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
