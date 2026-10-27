import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { KpiCard } from '../common/KpiCard'
import { Badge } from '../common/Badge'
import { HISTORICAL_SALES_30_DAYS, CATEGORY_BREAKDOWN } from '../../data/mockData'
import {
  Boxes,
  Package,
  AlertTriangle,
  Clock,
  IndianRupee,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Truck,
  Receipt,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

export const DashboardPage: React.FC = () => {
  const {
    totalMedicines,
    totalStockUnits,
    lowStockCount,
    nearExpiryBatchesCount,
    inventoryValuation,
    stockoutRisks,
    expiryRisks,
    purchaseInvoices,
    salesImports,
    setCurrentPage,
    pharmacyProfile,
    triggerSalesSync,
    isSyncingSales,
  } = useApp()

  const [timeRange, setTimeRange] = useState<'7' | '14' | '30'>('14')

  const chartData = React.useMemo(() => {
    const count = parseInt(timeRange, 10)
    return HISTORICAL_SALES_30_DAYS.slice(-count)
  }, [timeRange])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Pharmacy Operations & Demand Overview
            </h2>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Marg ERP Simulator (Connected)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Operational stock velocity, stockout alarms, and expiry risk monitoring for {pharmacyProfile.pharmacyName}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentPage('purchase-recommendations')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Purchase Recs
          </button>
          <button
            onClick={() => setCurrentPage('risk-center')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            Risk Center
          </button>
        </div>
      </div>

      {/* KPI Cards (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Medicines"
          value={totalMedicines}
          subtitle="Active SKUs in dispensary"
          icon={Boxes}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          onClick={() => setCurrentPage('inventory')}
        />

        <KpiCard
          title="Total Stock Units"
          value={totalStockUnits.toLocaleString()}
          subtitle="Strips, bottles & vials"
          icon={Package}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          trend={{ value: '+4.2% wk', isPositive: true }}
          onClick={() => setCurrentPage('inventory')}
        />

        <KpiCard
          title="Low-Stock Alerts"
          value={lowStockCount}
          subtitle="Below reorder threshold"
          icon={AlertTriangle}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
          badgeText="Requires Order"
          alertLevel={lowStockCount > 0 ? 'critical' : 'none'}
          onClick={() => setCurrentPage('purchase-recommendations')}
        />

        <KpiCard
          title="Near Expiry Batches"
          value={nearExpiryBatchesCount}
          subtitle={`Expiring within ${pharmacyProfile.nearExpiryThresholdDays} days`}
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          badgeText="Check Return"
          alertLevel={nearExpiryBatchesCount > 0 ? 'warning' : 'none'}
          onClick={() => setCurrentPage('risk-center')}
        />

        <KpiCard
          title="Inventory Valuation"
          value={`₹${(inventoryValuation / 1000).toFixed(1)}k`}
          subtitle={`Total: ₹${inventoryValuation.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          trend={{ value: 'Cost Basis', isNeutral: true }}
          onClick={() => setCurrentPage('inventory')}
        />
      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Historical Sales Trend Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Historical Sales & Billing Velocity
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Marg POS Data</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily dispensary revenue and units dispensed across retail billing counters
              </p>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              {(['7', '14', '30'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    timeRange === range
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {range} Days
                </button>
              ))}
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="antibioticsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-800">
                          <p className="font-bold text-slate-300">Date: {label}</p>
                          <p className="text-emerald-400 font-bold font-mono">
                            Total Revenue: ₹{data.revenue.toLocaleString('en-IN')}
                          </p>
                          <p className="text-slate-300">Units Dispensed: {data.units} packs</p>
                          <p className="text-sky-400">Antibiotics Share: ₹{data.antibiotics.toLocaleString('en-IN')}</p>
                          <p className="text-amber-400">Chronic Refills: ₹{data.chronic.toLocaleString('en-IN')}</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                  name="Total Sales"
                />
                <Area
                  type="monotone"
                  dataKey="antibiotics"
                  stroke="#0ea5e9"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#antibioticsGradient)"
                  name="Antibiotics"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                Gross Sales (₹)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                Antibiotics Surge
              </span>
            </div>
            <span className="text-emerald-700 font-semibold cursor-pointer hover:underline" onClick={() => setCurrentPage('sales-imports')}>
              View POS bill history →
            </span>
          </div>
        </div>

        {/* Category Share & Sync Health (1 Col) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Dispensary Sales by Category
              </h3>
              <span className="text-[10px] text-slate-400">30-day split</span>
            </div>

            {/* Donut chart */}
            <div className="h-44 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CATEGORY_BREAKDOWN}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {CATEGORY_BREAKDOWN.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${val}% of sales`, 'Share']}
                    contentStyle={{ borderRadius: '10px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-bold font-mono text-slate-900">6</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Classes</span>
              </div>
            </div>

            {/* Legend list */}
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {CATEGORY_BREAKDOWN.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-[11px] px-2 py-1 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="truncate text-slate-700 font-medium">{cat.name}</span>
                  </div>
                  <span className="font-mono text-slate-500 shrink-0 font-semibold">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick sync indicator */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] text-slate-600 font-medium">Marg ERP Auto-Sync</span>
            </div>
            <button
              onClick={() => triggerSalesSync()}
              disabled={isSyncingSales}
              className="text-[11px] text-emerald-700 font-bold hover:underline disabled:opacity-50"
            >
              {isSyncingSales ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Fast Risk Action Grid: Stockout Risks & Expiry Risks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stockout Risk List */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Critical Stockout Alarms ({stockoutRisks.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Medicines projected to run out before next distributor shipment
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentPage('purchase-recommendations')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Order all
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stockoutRisks.slice(0, 4).map((risk) => (
              <div key={risk.medicineId} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {risk.medicineName}
                    </span>
                    <Badge variant={risk.urgency === 'CRITICAL' ? 'critical' : 'high'} size="sm">
                      {risk.daysOfSupplyRemaining <= 0 ? 'Out of Stock' : `${risk.daysOfSupplyRemaining}d Supply`}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>Stock: <strong className="text-slate-800">{risk.currentStock}</strong></span>
                    <span>•</span>
                    <span>Velocity: {risk.dailyVelocity}/day</span>
                    <span>•</span>
                    <span>Reorder: {risk.reorderLevel}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <button
                    onClick={() => setCurrentPage('purchase-recommendations')}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  >
                    + Reorder {risk.suggestedOrderQty}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => setCurrentPage('risk-center')}
              className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center justify-center gap-1 w-full"
            >
              View detailed stockout risk analysis in Risk Center
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expiry Risk List */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Near-Expiry Batches ({expiryRisks.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Capital locked in batches nearing expiry window
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentPage('risk-center')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              Inspect all
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {expiryRisks.slice(0, 4).map((risk) => (
              <div key={risk.batchId} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {risk.medicineName}
                    </span>
                    <Badge variant={risk.daysToExpiry <= 0 ? 'critical' : risk.daysToExpiry <= 30 ? 'high' : 'warning'} size="sm">
                      {risk.daysToExpiry <= 0 ? 'Expired' : `${risk.daysToExpiry}d left`}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 font-mono">
                    <span>Batch: {risk.batchNumber}</span>
                    <span>•</span>
                    <span>Qty: {risk.quantity}</span>
                    <span>•</span>
                    <span>Exp: {risk.expiryDate}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold font-mono text-slate-900">
                    ₹{risk.capitalAtRisk.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {risk.returnEligible ? (
                      <span className="text-emerald-700 font-medium">Return Eligible</span>
                    ) : (
                      <span className="text-rose-600 font-medium">Non-returnable</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => setCurrentPage('risk-center')}
              className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center justify-center gap-1 w-full"
            >
              Generate return credit notes in Risk Center
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Import Activity (Purchase Bills & POS Sync Logs) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Recent Billing Software Ingestion & Sync Feeds
              </h3>
              <p className="text-[11px] text-slate-500">
                Purchase invoices and POS billing sync events imported into MedStock AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage('purchase-imports')}
              className="text-xs font-semibold text-slate-700 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              All Purchase Bills ({purchaseInvoices.length})
            </button>
            <button
              onClick={() => setCurrentPage('sales-imports')}
              className="text-xs font-semibold text-slate-700 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              All Sales Batches ({salesImports.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Latest Purchase Bill */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Truck className="w-3 h-3" />
                Latest Purchase Invoice
              </span>
              <Badge variant="success" size="sm">
                {purchaseInvoices[0]?.paymentStatus}
              </Badge>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {purchaseInvoices[0]?.distributorName}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {purchaseInvoices[0]?.invoiceNumber} • {purchaseInvoices[0]?.itemsCount} items
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold font-mono text-slate-900">
                  ₹{purchaseInvoices[0]?.totalAmount.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-slate-400">{purchaseInvoices[0]?.importedAt}</p>
              </div>
            </div>
          </div>

          {/* Latest POS Sync */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Receipt className="w-3 h-3" />
                Latest POS Sales Sync
              </span>
              <Badge variant="success" size="sm" dot>
                {salesImports[0]?.status}
              </Badge>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {salesImports[0]?.source}
                </p>
                <p className="text-[11px] text-slate-500">
                  {salesImports[0]?.billCount} bills • {salesImports[0]?.unitsSold} units dispensed
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold font-mono text-emerald-700">
                  ₹{salesImports[0]?.totalRevenue.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-slate-400">{salesImports[0]?.importedAt}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
