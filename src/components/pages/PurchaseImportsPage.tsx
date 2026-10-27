import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import type { PurchaseInvoice } from '../../types'
import { Badge } from '../common/Badge'
import { Modal } from '../common/Modal'
import {
  Truck,
  Upload,
  FileText,
  Search,
  IndianRupee,
  Eye,
  Download,
  FileSpreadsheet,
} from 'lucide-react'

export const PurchaseImportsPage: React.FC = () => {
  const {
    purchaseInvoices,
    triggerPurchaseImport,
    isImportingPurchase,
    addToast,
  } = useApp()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null)
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false)
  const [simDistributor, setSimDistributor] = useState('Cipla Logistics Hub')
  const [simInvoiceNumber, setSimInvoiceNumber] = useState('CIP-OCT-24891')
  const [simAmount, setSimAmount] = useState(64500)

  const filteredInvoices = purchaseInvoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.distributorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.distributorGst.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSimulateUpload = async () => {
    if (!simInvoiceNumber.trim()) {
      addToast('Validation Error', 'Invoice number cannot be blank.', 'error')
      return
    }
    if (simAmount <= 0) {
      addToast('Validation Error', 'Invoice amount must be greater than zero.', 'error')
      return
    }
    setIsSimulateModalOpen(false)
    await triggerPurchaseImport({
      distributorName: simDistributor,
      invoiceNumber: simInvoiceNumber.trim(),
      totalAmount: simAmount,
      itemsCount: 7,
    })
  }

  const handleExportTemplate = () => {
    addToast('Sample CSV Downloaded', 'Sample distributor purchase bill format (Marg ERP 9+ format) ready.', 'info')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Purchase Bill Ingestion & Distributor Invoices
            </h2>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Digital Billing Integrated
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingest electronic purchase bills from Marg ERP, Tally Prime, and distributor dispatch portals to auto-register batches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            CSV Template
          </button>
          <button
            onClick={() => setIsSimulateModalOpen(true)}
            disabled={isImportingPurchase}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {isImportingPurchase ? 'Ingesting Bill...' : 'Import Purchase Bill'}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Invoices Logged
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {purchaseInvoices.length} Bills
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Across 5 registered distributors
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              30-Day Procurement Value
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            ₹
            {purchaseInvoices
              .reduce((sum, inv) => sum + inv.totalAmount, 0)
              .toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
            GST Input Credit Claimed
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Integration Gateway
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-900 mt-2 flex items-center gap-2">
            <span>Marg ERP XML/CSV</span>
            <Badge variant="success" size="sm" dot>Active</Badge>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Automatic batch & expiry extractor enabled
          </span>
        </div>
      </div>

      {/* Search & Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by invoice #, distributor name, GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 bg-slate-50/50"
            />
          </div>
          <div className="text-xs text-slate-500">
            Showing <strong>{filteredInvoices.length}</strong> purchase bills
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Invoice # & Date</th>
                <th className="py-3 px-3">Distributor Details</th>
                <th className="py-3 px-3">Source Software</th>
                <th className="py-3 px-3">SKU Items</th>
                <th className="py-3 px-3">Taxable Value</th>
                <th className="py-3 px-3">GST Tax</th>
                <th className="py-3 px-3">Invoice Total</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  onClick={() => setSelectedInvoice(inv)}
                >
                  <td className="py-3 px-4">
                    <div className="font-bold font-mono text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {inv.invoiceNumber}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      Date: {inv.invoiceDate}
                    </div>
                    <div className="text-[10px] text-slate-400">Imported: {inv.importedAt}</div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{inv.distributorName}</div>
                    <div className="text-[10px] font-mono text-slate-400">GST: {inv.distributorGst}</div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {inv.sourceSystem}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                    {inv.itemsCount} medicines
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-700">
                    ₹{(inv.totalAmount - inv.taxAmount).toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-600">
                    ₹{inv.taxAmount.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-3 font-mono">
                    <span className="font-bold text-sm text-slate-900">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <Badge
                      variant={inv.paymentStatus === 'Paid' ? 'success' : 'neutral'}
                      size="sm"
                    >
                      {inv.paymentStatus}
                    </Badge>
                  </td>

                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="View Bill Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Purchase Bill: ${selectedInvoice.invoiceNumber}`}
          subtitle={`Distributor: ${selectedInvoice.distributorName} • GSTIN: ${selectedInvoice.distributorGst}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full text-xs">
              <span className="text-slate-500">
                Payment Status: <strong>{selectedInvoice.paymentStatus}</strong>
              </span>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold"
              >
                Close Bill
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Total Bill Value</span>
                <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  ₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">GST Amount</span>
                <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  ₹{selectedInvoice.taxAmount.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Billing Software</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedInvoice.sourceSystem}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Line Items Credited to Inventory
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Medicine</th>
                      <th className="py-2.5 px-3">Batch Number</th>
                      <th className="py-2.5 px-3">Billed Qty</th>
                      <th className="py-2.5 px-3">Free Units</th>
                      <th className="py-2.5 px-3">Cost Price</th>
                      <th className="py-2.5 px-3">MRP</th>
                      <th className="py-2.5 px-3">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-900">
                          {item.medicineName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-bold">
                          {item.batchNumber}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-700 font-semibold">
                          +{item.freeUnits}
                        </td>
                        <td className="py-2.5 px-3">
                          ₹{item.unitCost}
                        </td>
                        <td className="py-2.5 px-3">
                          ₹{item.mrp}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          ₹{item.totalAmount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Simulate Purchase Bill Upload Modal */}
      {isSimulateModalOpen && (
        <Modal
          isOpen={isSimulateModalOpen}
          onClose={() => setIsSimulateModalOpen(false)}
          title="Simulate Ingesting Purchase Invoice"
          subtitle="Simulates reading a distributor invoice or Marg ERP export file"
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulateUpload}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                Run Ingestion Simulation
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Distributor</label>
              <select
                value={simDistributor}
                onChange={(e) => setSimDistributor(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              >
                <option value="Cipla Logistics Hub">Cipla Logistics Hub</option>
                <option value="Sun Pharma Hub">Sun Pharma Hub</option>
                <option value="Torrent MedSupply">Torrent MedSupply</option>
                <option value="Micro Labs Logistics">Micro Labs Logistics</option>
                <option value="GlaxoSmithKline Distro">GlaxoSmithKline Distro</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Invoice Number</label>
              <input
                type="text"
                value={simInvoiceNumber}
                onChange={(e) => setSimInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Bill Amount (₹)</label>
              <input
                type="number"
                value={simAmount}
                onChange={(e) => setSimAmount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-xl border border-slate-200"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
              <strong>Simulated Action:</strong> Ingestion extracts line items, registers new batch numbers with manufacturing & expiry dates, and updates the pharmacy stock ledger automatically.
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
