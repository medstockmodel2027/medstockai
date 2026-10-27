import React, { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { Badge } from '../common/Badge'
import { Modal } from '../common/Modal'
import { EmptyState } from '../common/EmptyState'
import {
  ShoppingCart,
  Sparkles,
  Check,
  Printer,
  Trash2,
  FileText,
  ArrowRight,
} from 'lucide-react'

export const PurchaseRecommendationsPage: React.FC = () => {
  const {
    recommendations,
    toggleRecommendationSelection,
    toggleAllRecommendations,
    updateRecommendationQty,
    approvePurchaseOrders,
    dismissRecommendation,
    pharmacyProfile,
    addToast,
  } = useApp()

  const [filterUrgency, setFilterUrgency] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL')
  const [isPoModalOpen, setIsPoModalOpen] = useState(false)

  // Pending recommendations
  const pendingRecs = useMemo(() => {
    return recommendations.filter((r) => r.status === 'PENDING')
  }, [recommendations])

  const filteredRecs = useMemo(() => {
    return pendingRecs.filter((r) => {
      if (filterUrgency === 'ALL') return true
      return r.urgency === filterUrgency
    })
  }, [pendingRecs, filterUrgency])

  const selectedRecs = useMemo(() => {
    return pendingRecs.filter((r) => r.selected)
  }, [pendingRecs])

  const totalSelectedCost = useMemo(() => {
    return selectedRecs.reduce((sum, r) => sum + r.totalCost, 0)
  }, [selectedRecs])

  const totalGst = useMemo(() => {
    return selectedRecs.reduce((sum, r) => sum + Math.round(r.totalCost * 0.12), 0)
  }, [selectedRecs])

  const allSelected = filteredRecs.length > 0 && filteredRecs.every((r) => r.selected)

  const handleApproveSelected = () => {
    const ids = selectedRecs.map((r) => r.id)
    approvePurchaseOrders(ids)
    setIsPoModalOpen(false)
  }

  const handlePrintPo = () => {
    window.print()
    addToast('Printing PO Draft', 'Purchase order document sent to system print dialog.', 'info')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              AI Purchase Recommendations & Smart Reorder Queue
            </h2>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              {pendingRecs.length} Suggested Reorders
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated replenishment proposals calculated from daily sales velocity, seasonal illness surges, and supplier lead times.
          </p>
        </div>

        {selectedRecs.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPoModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Review & Draft PO ({selectedRecs.length} Items • ₹{totalSelectedCost.toLocaleString('en-IN')})
            </button>
          </div>
        )}
      </div>

      {/* Filter and Selection Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => toggleAllRecommendations(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span>Select All Visible ({filteredRecs.length})</span>
          </label>

          <span className="text-slate-300">|</span>

          <div className="flex items-center gap-1">
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((urg) => (
              <button
                key={urg}
                onClick={() => setFilterUrgency(urg)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  filterUrgency === urg
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {urg === 'ALL' ? 'All Priorities' : urg}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>
            Selected: <strong className="text-slate-900">{selectedRecs.length}</strong> items
          </span>
          <span>•</span>
          <span>
            Order Total: <strong className="text-emerald-700 font-mono">₹{totalSelectedCost.toLocaleString('en-IN')}</strong>
          </span>
        </div>
      </div>

      {/* Recommendations Table */}
      {filteredRecs.length === 0 ? (
        <EmptyState
          title="No pending purchase recommendations in this view"
          description="All critical stock items are currently fulfilled or filter returned 0 items."
          actionLabel="View All Reorders"
          onAction={() => setFilterUrgency('ALL')}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="py-3 px-3">Medicine & Generic Formulation</th>
                  <th className="py-3 px-3">Preferred Distributor</th>
                  <th className="py-3 px-3">Stock on Hand</th>
                  <th className="py-3 px-3">Suggested Order Qty</th>
                  <th className="py-3 px-3">Unit Cost / Pack</th>
                  <th className="py-3 px-3">Estimated Total</th>
                  <th className="py-3 px-3">Urgency & Runout</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecs.map((rec) => (
                  <tr
                    key={rec.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      rec.selected ? 'bg-emerald-50/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={rec.selected}
                        onChange={() => toggleRecommendationSelection(rec.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{rec.medicineName}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {rec.genericName}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        Reason: {rec.reason}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {rec.preferredSupplier}
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <span className={`font-bold ${rec.currentStock === 0 ? 'text-rose-600' : rec.currentStock <= 35 ? 'text-amber-700' : 'text-slate-800'}`}>
                        {rec.currentStock} units
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="10"
                          step="10"
                          value={rec.suggestedQty}
                          onChange={(e) =>
                            updateRecommendationQty(
                              rec.id,
                              Math.max(1, parseInt(e.target.value) || 0)
                            )
                          }
                          className="w-20 px-2 py-1 text-xs font-mono font-bold text-slate-900 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 bg-white"
                        />
                        <span className="text-[10px] text-slate-400 font-medium">
                          units ({rec.packSize}/pk)
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700">
                      ₹{rec.unitCost.toFixed(1)}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                      ₹{rec.totalCost.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <Badge
                          variant={rec.urgency === 'CRITICAL' ? 'critical' : rec.urgency === 'HIGH' ? 'high' : 'medium'}
                          size="sm"
                          dot
                        >
                          {rec.urgency}
                        </Badge>
                        <div className="text-[10px] text-rose-600 font-medium font-mono">
                          {rec.runoutDate}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            approvePurchaseOrders([rec.id])
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                          title="Generate individual PO"
                        >
                          Order
                        </button>
                        <button
                          onClick={() => dismissRecommendation(rec.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Dismiss recommendation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sticky Bottom Order Bar if Items Selected */}
      {selectedRecs.length > 0 && (
        <div className="sticky bottom-4 z-20 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-800 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                <span>{selectedRecs.length} Medicines Queued for Purchase Order</span>
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">
                  PO READY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Combined estimated distributor procurement value:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="text-right mr-2">
              <span className="text-xs text-slate-400 font-mono block">Estimated Spend</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                ₹{totalSelectedCost.toLocaleString('en-IN')}
              </span>
            </div>
            <button
              onClick={() => setIsPoModalOpen(true)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span>Export Purchase Order Draft</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* PO Draft Preview Modal */}
      {isPoModalOpen && (
        <Modal
          isOpen={isPoModalOpen}
          onClose={() => setIsPoModalOpen(false)}
          title="Purchase Order Draft (PO-2026-OCT-094)"
          subtitle={`Dispensary: ${pharmacyProfile.pharmacyName} • Marg ERP Integration Ref #PO-8821`}
          maxWidth="4xl"
          footer={
            <div className="flex items-center justify-between w-full text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPo}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPoModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Edit Items
                </button>
                <button
                  onClick={handleApproveSelected}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Save PO Draft (Simulated Dispatch)
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-xs text-slate-800">
            {/* Header info */}
            <div className="flex justify-between border-b border-slate-200 pb-4">
              <div>
                <h4 className="text-base font-extrabold text-slate-900">
                  {pharmacyProfile.pharmacyName}
                </h4>
                <p className="text-slate-600">{pharmacyProfile.address}</p>
                <p className="text-slate-500 font-mono mt-1">
                  DL No: {pharmacyProfile.drugLicenseNo} • GSTIN: {pharmacyProfile.gstin}
                </p>
                <p className="text-slate-500">Pharmacist: {pharmacyProfile.pharmacistInCharge}</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Purchase Order
                </span>
                <p className="text-sm font-bold font-mono text-slate-900">PO-2026-OCT-094</p>
                <p className="text-slate-500">Date: 26 Oct 2026</p>
                <p className="text-slate-500">Payment Terms: 30-Day Credit</p>
              </div>
            </div>

            {/* PO Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Medicine Formulation</th>
                    <th className="py-2.5 px-3">Distributor Target</th>
                    <th className="py-2.5 px-3">Order Qty</th>
                    <th className="py-2.5 px-3">Unit Cost</th>
                    <th className="py-2.5 px-3">GST (12%)</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {selectedRecs.map((rec, idx) => {
                    const gstAmount = Math.round(rec.totalCost * 0.12)
                    return (
                      <tr key={rec.id}>
                        <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-sans font-bold text-slate-900">
                          {rec.medicineName}
                          <span className="block text-[10px] text-slate-500 font-normal">
                            {rec.genericName}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-700">
                          {rec.preferredSupplier}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {rec.suggestedQty}
                        </td>
                        <td className="py-2 px-3">₹{rec.unitCost}</td>
                        <td className="py-2 px-3">₹{gstAmount}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          ₹{(rec.totalCost + gstAmount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals Breakdown */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 text-right font-mono text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal (Net):</span>
                  <span>₹{totalSelectedCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Estimated GST (12%):</span>
                  <span>₹{totalGst.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-sm text-slate-900">
                  <span>Grand Total:</span>
                  <span>₹{(totalSelectedCost + totalGst).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
              <strong>Order Dispatch Notice (Phase 1 Simulated):</strong> This purchase order draft simulates export to Marg ERP format (Order Export Directory) for distributor review. Real transmission requires distributor API integration in Phase 2.
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
