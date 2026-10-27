import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import type { ExpiryRiskItem } from '../../types'
import { Badge } from '../common/Badge'
import { Modal } from '../common/Modal'
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  RotateCcw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'

export const RiskCenterPage: React.FC = () => {
  const {
    stockoutRisks,
    expiryRisks,
    setCurrentPage,
    markBatchReturnProcessed,
    addToast,
    pharmacyProfile,
  } = useApp()

  const [activeTab, setActiveTab] = useState<'all' | 'stockout' | 'expiry'>('all')
  const [returnModalBatch, setReturnModalBatch] = useState<ExpiryRiskItem | null>(null)
  const [returnReason, setReturnReason] = useState('Near-expiry within 60-day distributor credit window')

  // Total calculations
  const totalCapitalAtExpiryRisk = expiryRisks.reduce((sum, r) => sum + r.capitalAtRisk, 0)
  const totalPotentialRevenueLoss = stockoutRisks.reduce((sum, r) => sum + r.potentialRevenueLoss, 0)
  const returnEligibleCount = expiryRisks.filter((r) => r.returnEligible).length

  const handleProcessReturn = (batch: ExpiryRiskItem) => {
    markBatchReturnProcessed(batch.batchId)
    setReturnModalBatch(null)
  }

  const handleApplyDiscount = (batch: ExpiryRiskItem) => {
    addToast(
      'Clearance Discount Tagged',
      `Applied 15% promotional clearance discount on Batch ${batch.batchNumber} in POS billing counter.`,
      'info'
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Risk Center & Capital Loss Prevention
            </h2>
            <span className="text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              {stockoutRisks.length + expiryRisks.length} Actionable Threats
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify imminent stockouts before sales are lost, and track expiring batches for timely distributor credit returns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage('purchase-recommendations')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Resolve via Auto-PO
          </button>
        </div>
      </div>

      {/* 3 Executive Risk Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-rose-200/90 shadow-xs ring-1 ring-rose-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">
              Projected Stockout Loss
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-2">
            ₹{totalPotentialRevenueLoss.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Across {stockoutRisks.length} high-velocity medicines
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-amber-200/90 shadow-xs ring-1 ring-amber-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Capital Locked at Expiry Risk
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-2">
            ₹{totalCapitalAtExpiryRisk.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {expiryRisks.length} batches within {pharmacyProfile.nearExpiryThresholdDays} days
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-emerald-200/90 shadow-xs ring-1 ring-emerald-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Distributor Return Window
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
            {returnEligibleCount} Batches
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
            Simulated Return Window (Subject to distributor terms)
          </span>
        </div>
      </div>

      {/* Tab Filter */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl max-w-md">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'all'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All Threats ({stockoutRisks.length + expiryRisks.length})
        </button>
        <button
          onClick={() => setActiveTab('stockout')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'stockout'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Stockouts ({stockoutRisks.length})
        </button>
        <button
          onClick={() => setActiveTab('expiry')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'expiry'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Expiries ({expiryRisks.length})
        </button>
      </div>

      {/* Stockout Risk Section */}
      {(activeTab === 'all' || activeTab === 'stockout') && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Stockout Threat Matrix & Estimated Revenue Loss
                </h3>
                <p className="text-[11px] text-slate-500">
                  Prioritized by remaining days of supply and average daily sales velocity
                </p>
              </div>
            </div>
            <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-lg">
              {stockoutRisks.filter((r) => r.urgency === 'CRITICAL').length} Critical Imminent
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-3">Therapeutic Class</th>
                  <th className="py-3 px-3">Stock on Hand</th>
                  <th className="py-3 px-3">Sales Run-Rate</th>
                  <th className="py-3 px-3">Days Supply Left</th>
                  <th className="py-3 px-3">Weekly Missed Sales</th>
                  <th className="py-3 px-3">Preferred Distributor</th>
                  <th className="py-3 px-3">Urgency</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockoutRisks.map((risk) => (
                  <tr key={risk.medicineId} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {risk.medicineName}
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                        {risk.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold">
                      <span className={risk.currentStock === 0 ? 'text-rose-600' : 'text-slate-800'}>
                        {risk.currentStock} units
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600">
                      {risk.dailyVelocity} / day
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <span className={`font-bold ${risk.daysOfSupplyRemaining <= 2 ? 'text-rose-600' : 'text-amber-600'}`}>
                        {risk.daysOfSupplyRemaining <= 0 ? 'STOCKOUT' : `${risk.daysOfSupplyRemaining} days`}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-rose-700 font-semibold">
                      ₹{risk.potentialRevenueLoss.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-3 text-slate-600 font-medium truncate max-w-[140px]">
                      {risk.preferredSupplier}
                    </td>

                    <td className="py-3 px-3">
                      <Badge variant={risk.urgency === 'CRITICAL' ? 'critical' : 'high'} size="sm" dot>
                        {risk.urgency}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setCurrentPage('purchase-recommendations')}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors"
                      >
                        + PO {risk.suggestedOrderQty}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expiry Risk Section */}
      {(activeTab === 'all' || activeTab === 'expiry') && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Batch Expiry Horizon & Distributor Return Claims
                </h3>
                <p className="text-[11px] text-slate-500">
                  Batches expiring soon. Generate credit return requests before distributor cut-off dates.
                </p>
              </div>
            </div>
            <span className="text-xs text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-lg">
              ₹{totalCapitalAtExpiryRisk.toLocaleString('en-IN')} Capital At Risk
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Medicine & Batch Number</th>
                  <th className="py-3 px-3">Expiry Date</th>
                  <th className="py-3 px-3">Days Remaining</th>
                  <th className="py-3 px-3">Units at Risk</th>
                  <th className="py-3 px-3">Capital Value</th>
                  <th className="py-3 px-3">Distributor Supply Hub</th>
                  <th className="py-3 px-3">Return Window</th>
                  <th className="py-3 px-4 text-right">Mitigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expiryRisks.map((batch) => {
                  const isExpired = batch.daysToExpiry <= 0
                  return (
                    <tr key={batch.batchId} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{batch.medicineName}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          Batch: {batch.batchNumber}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                        {batch.expiryDate}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <span className={`font-bold ${isExpired ? 'text-rose-600' : batch.daysToExpiry <= 30 ? 'text-amber-600' : 'text-slate-700'}`}>
                          {isExpired ? 'EXPIRED' : `${batch.daysToExpiry} days`}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {batch.quantity} units
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-amber-700">
                        ₹{batch.capitalAtRisk.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {batch.supplierName}
                      </td>

                      <td className="py-3 px-3">
                        {batch.returnEligible ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            {batch.returnWindowDays > 0 ? `${batch.returnWindowDays}d left to claim` : 'Eligible'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Non-returnable</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {batch.returnEligible ? (
                            <button
                              onClick={() => setReturnModalBatch(batch)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                            >
                              Draft Return Note
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApplyDiscount(batch)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors"
                            >
                              Tag 15% Clearance
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return Note Modal */}
      {returnModalBatch && (
        <Modal
          isOpen={!!returnModalBatch}
          onClose={() => setReturnModalBatch(null)}
          title={`Draft Distributor Credit Note: Batch ${returnModalBatch.batchNumber}`}
          subtitle={`Supplier: ${returnModalBatch.supplierName} • Medicine: ${returnModalBatch.medicineName}`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full text-xs">
              <button
                onClick={() => setReturnModalBatch(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProcessReturn(returnModalBatch)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
              >
                Draft Return Request & Deduct Stock
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
              <div className="font-bold">Simulated Distributor Return Policy: Guideline Match</div>
              <p className="text-[11px] leading-relaxed">
                This batch falls within the simulated 60-day near-expiry return window. Note that final credit notes are subject to physical verification and distributor trading terms.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">Units to Return</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">{returnModalBatch.quantity} units</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">Credit Claim Value</span>
                <p className="text-base font-bold text-emerald-700 mt-0.5">₹{returnModalBatch.capitalAtRisk.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Return Reason Memo</label>
              <input
                type="text"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>

            <div className="text-[11px] text-slate-500">
              Upon confirmation, these units will be removed from active inventory and a credit note will be forwarded to {returnModalBatch.supplierName}.
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
