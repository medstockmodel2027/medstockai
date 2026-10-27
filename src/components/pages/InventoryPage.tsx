import React, { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import type { Medicine } from '../../types'
import { Badge } from '../common/Badge'
import { Modal } from '../common/Modal'
import { EmptyState } from '../common/EmptyState'
import {
  Search,
  Filter,
  ArrowUpDown,
  Boxes,
  Eye,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  Download,
} from 'lucide-react'

export const InventoryPage: React.FC = () => {
  const {
    medicines,
    batches,
    searchQuery,
    setSearchQuery,
    pharmacyProfile,
    addToast,
    setCurrentPage,
    adjustMedicineStock,
  } = useApp()

  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all')
  const [expiryStatusFilter, setExpiryStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'stock-asc' | 'stock-desc' | 'valuation'>('stock-asc')
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [adjustQty, setAdjustQty] = useState<number>(0)
  const [adjustReason, setAdjustReason] = useState<string>('Physical audit variance')

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>()
    medicines.forEach((m) => set.add(m.category))
    return ['all', ...Array.from(set)]
  }, [medicines])

  // Helper to get active batches for a medicine directly from batches state
  const getMedicineBatches = (medId: string) => {
    return batches.filter((b) => b.medicineId === medId)
  }

  // Filtered & sorted medicines
  const filteredMedicines = useMemo(() => {
    return medicines
      .filter((med) => {
        const medBatches = batches.filter((b) => b.medicineId === med.id)
        const matchesSearch =
          !searchQuery ||
          med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          med.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          med.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          med.preferredSupplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
          medBatches.some((b) => b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesCategory =
          categoryFilter === 'all' || med.category === categoryFilter

        const matchesStock =
          stockStatusFilter === 'all'
            ? true
            : stockStatusFilter === 'low_stock'
            ? med.status === 'low_stock' || med.totalStock <= med.reorderLevel
            : stockStatusFilter === 'out_of_stock'
            ? med.totalStock === 0
            : med.status === 'in_stock' && med.totalStock > med.reorderLevel

        const matchesExpiry =
          expiryStatusFilter === 'all'
            ? true
            : expiryStatusFilter === 'near_expiry'
            ? medBatches.some(
                (b) => b.daysToExpiry <= pharmacyProfile.nearExpiryThresholdDays
              )
            : !medBatches.some(
                (b) => b.daysToExpiry <= pharmacyProfile.nearExpiryThresholdDays
              )

        return matchesSearch && matchesCategory && matchesStock && matchesExpiry
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        if (sortBy === 'stock-asc') return a.totalStock - b.totalStock
        if (sortBy === 'stock-desc') return b.totalStock - a.totalStock
        if (sortBy === 'valuation') return b.totalStock * b.unitCost - a.totalStock * a.unitCost
        return 0
      })
  }, [medicines, batches, searchQuery, categoryFilter, stockStatusFilter, expiryStatusFilter, sortBy, pharmacyProfile.nearExpiryThresholdDays])

  const handleOpenAdjust = (med: Medicine) => {
    setSelectedMedicine(med)
    setAdjustQty(med.totalStock)
    setIsAdjustModalOpen(true)
  }

  const handleSaveAdjustment = () => {
    if (!selectedMedicine) return
    adjustMedicineStock(selectedMedicine.id, adjustQty, adjustReason)
    setIsAdjustModalOpen(false)
  }

  const handleExportCsv = () => {
    addToast('Inventory CSV Generated', 'Downloaded dispensary inventory snapshot (Marg ERP compatible format).', 'info')
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Master Medicine & Batch Inventory
            </h2>
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
              {filteredMedicines.length} of {medicines.length} SKUs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock on hand, unit cost, batch expiries, and dispensary shelf locations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => setCurrentPage('purchase-recommendations')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Reorder Low Stock
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by name, generic salt, batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 bg-slate-50/50 font-medium text-slate-700"
            >
              <option value="all">All Categories ({medicines.length})</option>
              {categories
                .filter((c) => c !== 'all')
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div>
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 bg-slate-50/50 font-medium text-slate-700"
            >
              <option value="all">All Stock Statuses</option>
              <option value="low_stock">⚠️ Low Stock (Under Reorder)</option>
              <option value="in_stock">✅ Healthy Stock</option>
              <option value="out_of_stock">⛔ Out of Stock (0 Units)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 bg-slate-50/50 font-medium text-slate-700"
            >
              <option value="stock-asc">Stock: Low to High (Urgent First)</option>
              <option value="stock-desc">Stock: High to Low</option>
              <option value="valuation">Inventory Valuation: High to Low</option>
              <option value="name">Medicine Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold">Quick Filters:</span>
          <button
            onClick={() => {
              setStockStatusFilter('low_stock')
              setCategoryFilter('all')
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              stockStatusFilter === 'low_stock'
                ? 'bg-rose-50 text-rose-800 border-rose-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Low Stock Only
          </button>
          <button
            onClick={() => {
              setExpiryStatusFilter(expiryStatusFilter === 'near_expiry' ? 'all' : 'near_expiry')
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              expiryStatusFilter === 'near_expiry'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Near-Expiry Batches (&lt;60d)
          </button>
          <button
            onClick={() => {
              setCategoryFilter('Antibiotics')
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              categoryFilter === 'Antibiotics'
                ? 'bg-sky-50 text-sky-800 border-sky-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Antibiotics
          </button>
          {(categoryFilter !== 'all' || stockStatusFilter !== 'all' || expiryStatusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setCategoryFilter('all')
                setStockStatusFilter('all')
                setExpiryStatusFilter('all')
                setSearchQuery('')
              }}
              className="text-xs text-rose-600 hover:underline font-semibold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Medicines Table */}
      {filteredMedicines.length === 0 ? (
        <EmptyState
          title="No medicines match your filters"
          description="Try broadening your search term or resetting category and stock status filters."
          actionLabel="Reset All Filters"
          onAction={() => {
            setCategoryFilter('all')
            setStockStatusFilter('all')
            setExpiryStatusFilter('all')
            setSearchQuery('')
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Medicine & Generic Details</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Stock Units</th>
                  <th className="py-3 px-3">Days Supply</th>
                  <th className="py-3 px-3">Reorder Point</th>
                  <th className="py-3 px-3">Batches on Shelf</th>
                  <th className="py-3 px-3">Unit Cost / MRP</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMedicines.map((med) => {
                  const medBatches = getMedicineBatches(med.id)
                  const nearestBatch = medBatches.slice().sort((a, b) => a.daysToExpiry - b.daysToExpiry)[0]
                  const hasNearExpiry = nearestBatch && nearestBatch.daysToExpiry <= pharmacyProfile.nearExpiryThresholdDays
                  const isStockCritical = med.totalStock === 0 || med.daysOfSupply <= 2

                  return (
                    <tr
                      key={med.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedMedicine(med)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {med.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium line-clamp-1">
                          {med.genericName}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {med.dosageForm} • {med.unit}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {med.category}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <div className={`text-sm font-bold ${med.totalStock === 0 ? 'text-rose-600' : isStockCritical ? 'text-rose-600' : 'text-slate-900'}`}>
                          {med.totalStock}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {med.totalStock === 0 ? 'Out of Stock' : `${med.dailyVelocity}/day sold`}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <span className={`font-semibold ${med.daysOfSupply <= 2 ? 'text-rose-600' : med.daysOfSupply <= 5 ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {med.daysOfSupply.toFixed(1)} days
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-700">
                        <div>{med.reorderLevel} units</div>
                        <div className="text-[10px] text-slate-400">Safety: {med.safetyStock}</div>
                      </td>

                      <td className="py-3 px-3">
                        {medBatches.length > 0 ? (
                          <div>
                            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-800">
                              <span>{nearestBatch.batchNumber}</span>
                              {hasNearExpiry && (
                                <span className="w-2 h-2 rounded-full bg-amber-500" title="Near expiry" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Exp: {nearestBatch.expiryDate} ({nearestBatch.daysToExpiry}d)
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No batches</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <div className="font-semibold text-slate-900">₹{med.unitCost.toFixed(1)}</div>
                        <div className="text-[10px] text-slate-400">MRP: ₹{med.mrp.toFixed(1)}</div>
                      </td>

                      <td className="py-3 px-3">
                        {med.totalStock === 0 ? (
                          <Badge variant="critical" size="sm" dot>Out of Stock</Badge>
                        ) : med.status === 'low_stock' || med.totalStock <= med.reorderLevel ? (
                          <Badge variant="warning" size="sm" dot>Low Stock</Badge>
                        ) : (
                          <Badge variant="success" size="sm" dot>In Stock</Badge>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedMedicine(med)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Inspect Batches"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenAdjust(med)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Adjust Stock"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>
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

      {/* Batch Details Inspection Modal */}
      {selectedMedicine && !isAdjustModalOpen && (
        <Modal
          isOpen={!!selectedMedicine}
          onClose={() => setSelectedMedicine(null)}
          title={selectedMedicine.name}
          subtitle={`Generic: ${selectedMedicine.genericName} • Category: ${selectedMedicine.category}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500">
                Supplier: <strong>{selectedMedicine.preferredSupplier}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenAdjust(selectedMedicine)
                  }}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                >
                  Adjust Physical Stock
                </button>
                <button
                  onClick={() => {
                    setSelectedMedicine(null)
                    setCurrentPage('purchase-recommendations')
                  }}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  Create Reorder PO
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Total Stock</span>
                <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  {selectedMedicine.totalStock} {selectedMedicine.unit.split(' ')[0]}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Daily Velocity</span>
                <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  {selectedMedicine.dailyVelocity} / day
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Days of Supply</span>
                <p className={`text-base font-bold font-mono mt-0.5 ${selectedMedicine.daysOfSupply <= 3 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {selectedMedicine.daysOfSupply.toFixed(1)} days
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Reorder Point</span>
                <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  {selectedMedicine.reorderLevel} units
                </p>
              </div>
            </div>

            {/* Batches Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-emerald-600" />
                Active Batches in Pharmacy Dispensary ({getMedicineBatches(selectedMedicine.id).length})
              </h4>

              {getMedicineBatches(selectedMedicine.id).length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                  No active batches recorded in dispensary. Please import purchase bill or adjust stock.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Batch #</th>
                        <th className="py-2.5 px-3">Shelf Rack</th>
                        <th className="py-2.5 px-3">Qty</th>
                        <th className="py-2.5 px-3">Expiry Date</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Cost / MRP</th>
                        <th className="py-2.5 px-3">Distributor Return</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getMedicineBatches(selectedMedicine.id).map((batch) => (
                        <tr key={batch.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {batch.batchNumber}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {batch.rackLocation}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                            {batch.quantity}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            <span className={batch.daysToExpiry <= 30 ? 'text-rose-600 font-bold' : batch.daysToExpiry <= 60 ? 'text-amber-600 font-bold' : 'text-slate-700'}>
                              {batch.expiryDate}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {batch.daysToExpiry <= 0 ? 'Expired' : `${batch.daysToExpiry} days left`}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge
                              variant={batch.daysToExpiry <= 0 ? 'critical' : batch.daysToExpiry <= 60 ? 'warning' : 'success'}
                              size="sm"
                            >
                              {batch.daysToExpiry <= 0 ? 'Expired' : batch.daysToExpiry <= 60 ? 'Near Expiry' : 'Safe'}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            ₹{batch.unitCost} / ₹{batch.mrp}
                          </td>
                          <td className="py-2.5 px-3">
                            {batch.returnEligible ? (
                              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                                Return Eligible
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Standard</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Stock Adjustment Modal */}
      {selectedMedicine && isAdjustModalOpen && (
        <Modal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          title={`Adjust Physical Stock: ${selectedMedicine.name}`}
          subtitle="Update on-hand count following physical dispensary stock verification"
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdjustment}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                Save Adjustment
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Verified Physical Stock Quantity ({selectedMedicine.unit})
              </label>
              <input
                type="number"
                min="0"
                value={adjustQty}
                onChange={(e) => setAdjustQty(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Current system ledger count: {selectedMedicine.totalStock} units
              </span>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Reason for Adjustment
              </label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 bg-white"
              >
                <option value="Physical audit variance">Physical audit variance</option>
                <option value="Damaged / broken container">Damaged / broken container</option>
                <option value="Customer return unbilled">Customer return unbilled</option>
                <option value="Distributor sample addition">Distributor sample addition</option>
              </select>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
              <strong>Audit Notice:</strong> Adjustments in MedStock AI are tracked against Marg ERP synchronization timestamps. Ensure physical counts match counter registers.
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
