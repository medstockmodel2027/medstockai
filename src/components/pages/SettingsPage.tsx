import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import {
  Building2,
  SlidersHorizontal,
  Database,
  RotateCcw,
  Download,
  Check,
  Radio,
} from 'lucide-react'

export const SettingsPage: React.FC = () => {
  const {
    pharmacyProfile,
    updatePharmacyProfile,
    resetToMockData,
    addToast,
    medicines,
    batches,
    purchaseInvoices,
    salesImports,
    recommendations,
  } = useApp()

  const [formData, setFormData] = useState({ ...pharmacyProfile })
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updatePharmacyProfile(formData)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2500)
    addToast('Settings Saved', 'Pharmacy profile and alert parameters updated successfully.', 'success')
  }

  const handleExportStateJson = () => {
    const fullState = {
      profile: pharmacyProfile,
      exportedAt: new Date().toISOString(),
      medicinesCount: medicines.length,
      batchesCount: batches.length,
      invoicesCount: purchaseInvoices.length,
      salesImportsCount: salesImports.length,
      recommendationsCount: recommendations.length,
      medicines,
      batches,
      purchaseInvoices,
      salesImports,
      recommendations,
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullState, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `medstock_ai_state_${Date.now()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()

    addToast('State Exported', 'Downloaded complete pharmacy state as JSON for FastAPI / PostgreSQL migration.', 'info')
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Pharmacy Configuration & Integration Settings
            </h2>
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
              Retail Type C
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure drug license identifiers, digital billing software sync hooks, and AI reorder risk tolerances.
          </p>
        </div>

        <button
          onClick={handleExportStateJson}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Export State JSON
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Pharmacy Profile Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Dispensary & Drug License Credentials
              </h3>
              <p className="text-[11px] text-slate-500">
                Official retail license details printed on generated Purchase Orders
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Pharmacy / Chemist Name
              </label>
              <input
                type="text"
                value={formData.pharmacyName}
                onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Branch Identifier
              </label>
              <input
                type="text"
                value={formData.branchName}
                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Drug License Number (DL-20B / 21B)
              </label>
              <input
                type="text"
                value={formData.drugLicenseNo}
                onChange={(e) => setFormData({ ...formData, drugLicenseNo: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 bg-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                GSTIN / Tax Identification
              </label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 bg-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Chief Registered Pharmacist
              </label>
              <input
                type="text"
                value={formData.pharmacistInCharge}
                onChange={(e) => setFormData({ ...formData, pharmacistInCharge: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Dispensary Contact Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                Dispensary Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Alert Thresholds Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Inventory Alarm & Expiry Horizons
              </h3>
              <p className="text-[11px] text-slate-500">
                Trigger criteria for stockout warnings and distributor return windows
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Low-Stock Warning Horizon (Days of Supply)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.lowStockThresholdDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lowStockThresholdDays: parseInt(e.target.value) || 5,
                    })
                  }
                  className="w-32 px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                />
                <span className="text-slate-500">days of sales velocity remaining</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Near-Expiry Alert Horizon
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={formData.nearExpiryThresholdDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nearExpiryThresholdDays: parseInt(e.target.value) || 60,
                    })
                  }
                  className="w-48 px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  <option value={30}>30 Days (Urgent Only)</option>
                  <option value={60}>60 Days (Recommended for Returns)</option>
                  <option value={90}>90 Days (Early Warning)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Digital Billing Integration Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Billing Software & POS Connector
              </h3>
              <p className="text-[11px] text-slate-500">
                Integration configuration with in-store billing systems
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Connected Billing Software
              </label>
              <select
                value={formData.billingSoftware}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingSoftware: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
              >
                <option value="Marg ERP 9+">Marg ERP 9+ (Active)</option>
                <option value="Tally Prime">Tally Prime (XML Interface)</option>
                <option value="Vyapar">Vyapar POS</option>
                <option value="Custom CSV POS">Custom File / Excel POS</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Synchronization Method
              </label>
              <select
                value={formData.syncMode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    syncMode: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="Automated Real-time (Simulated)">
                  Automated Real-time (Simulated socket)
                </option>
                <option value="Daily Scheduled">Daily Scheduled (Close of business)</option>
                <option value="Manual Upload">Manual File Ingestion Only</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse shrink-0" />
            <span>
              Configured adapter for <strong>{formData.billingSoftware}</strong> in simulated mode. Ready for Phase 2 FastAPI REST bridge (simulated in Phase 1).
            </span>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            {isSaved ? <Check className="w-4 h-4" /> : null}
            {isSaved ? 'Settings Saved!' : 'Save Pharmacy Settings'}
          </button>

          <button
            type="button"
            onClick={resetToMockData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All Mock Data
          </button>
        </div>
      </form>
    </div>
  )
}
