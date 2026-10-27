import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { DEMO_FORECASTS } from '../../data/mockData'
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Zap,
} from 'lucide-react'
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  ComposedChart,
} from 'recharts'

export const DemandForecastPage: React.FC = () => {
  const { setCurrentPage } = useApp()
  const [selectedForecastId, setSelectedForecastId] = useState<string>(DEMO_FORECASTS[0].medicineId)

  const activeForecast = DEMO_FORECASTS.find((f) => f.medicineId === selectedForecastId) || DEMO_FORECASTS[0]

  // Combined chart data: historical days + future 14 forecast days
  const combinedChartData = React.useMemo(() => {
    const historical = activeForecast.historicalSales.map((h) => ({
      date: h.date,
      historical: h.units,
      predicted: undefined,
      upperBand: undefined,
      lowerBand: undefined,
    }))

    // Connect the last historical point with the first forecast point
    const lastHist = historical[historical.length - 1]

    const future = activeForecast.forecastPoints.map((f, idx) => ({
      date: f.date,
      historical: idx === 0 ? lastHist.historical : undefined,
      predicted: f.predicted,
      upperBand: f.upperBand,
      lowerBand: f.lowerBand,
    }))

    return [...historical, ...future]
  }, [activeForecast])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              AI Demand Forecasting & Surge Modeling
            </h2>
            <span className="text-xs font-semibold bg-violet-50 text-violet-800 border border-violet-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              Simulated Forecast Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            14-day forward consumption modeling based on past billing velocity, seasonal trends, and local illness waves.
          </p>
        </div>

        <button
          onClick={() => setCurrentPage('purchase-recommendations')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <span>View Automated PO Drafts</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mandatory Simulated Data Disclaimer Notice */}
      <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900">
          <p className="font-bold">Demonstration Demand Forecast Engine — Synthetic Preview</p>
          <p className="mt-0.5 leading-relaxed text-amber-800">
            All forward consumption curves, upper/lower confidence bands, and the reported 4.8% MAPE are <strong>illustrative demonstration parameters</strong>. In Phase 1, no actual machine learning models (Prophet / LightGBM) have been trained or evaluated against dispensary history. Real validated predictions will activate upon connecting live MySQL and FastAPI model endpoints in Phase 2.
          </p>
        </div>
      </div>

      {/* Model Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {DEMO_FORECASTS.map((f) => (
          <button
            key={f.medicineId}
            onClick={() => setSelectedForecastId(f.medicineId)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 border ${
              selectedForecastId === f.medicineId
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{f.medicineName}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                selectedForecastId === f.medicineId
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {f.category}
            </span>
          </button>
        ))}
      </div>

      {/* Forecast Interactive Detail Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold text-slate-900">
                {activeForecast.medicineName}
              </h3>
              {activeForecast.surgeTag && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-rose-600" />
                  {activeForecast.surgeTag}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Generic: <strong>{activeForecast.genericName}</strong> • Category: {activeForecast.category}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Simulation Score
              </span>
              <span className="text-sm font-bold font-mono text-emerald-700">
                {activeForecast.confidenceScore}% (Simulated Target)
              </span>
            </div>
            <button
              onClick={() => setCurrentPage('purchase-recommendations')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              Order for Projected Demand
            </button>
          </div>
        </div>

        {/* 4 Metric Callout Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Current Stock</span>
            <p className="text-xl font-bold font-mono text-slate-900 mt-1">
              {activeForecast.currentStock} units
            </p>
            <span className="text-[11px] text-rose-600 font-semibold mt-0.5 block">
              Stockout in ~{(activeForecast.currentStock / 18).toFixed(1)} days
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">14-Day Demand</span>
            <p className="text-xl font-bold font-mono text-emerald-700 mt-1">
              +{activeForecast.predicted14DayDemand} units
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Projected requirement
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Illustrative MAPE</span>
            <p className="text-xl font-bold font-mono text-slate-900 mt-1">
              4.8%
            </p>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
              Target Simulation Benchmark
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Target Architecture</span>
            <p className="text-sm font-bold text-slate-900 mt-1 truncate">
              Prophet + LightGBM
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Phase 1 Preview (No ML Run)
            </span>
          </div>
        </div>

        {/* Forecast Chart */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Historical Sales (Solid) vs Forward 14-Day Forecast (Dotted & Confidence Band)
            </h4>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                Actual Daily Sales
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                AI Forecast
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-100 rounded-sm border border-emerald-300" />
                95% Confidence Band
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combinedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-300">{label}</p>
                          {data.historical !== undefined && (
                            <p className="text-slate-100">
                              Actual Billed: <strong>{data.historical} units</strong>
                            </p>
                          )}
                          {data.predicted !== undefined && (
                            <p className="text-emerald-400 font-bold">
                              Forecasted: {data.predicted} units
                            </p>
                          )}
                          {data.upperBand !== undefined && (
                            <p className="text-slate-400 text-[10px]">
                              Expected range: {data.lowerBand} – {data.upperBand} units (95% CI)
                            </p>
                          )}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                {/* Confidence band */}
                <Area
                  type="monotone"
                  dataKey="upperBand"
                  stroke="transparent"
                  fill="url(#confidenceBand)"
                />
                {/* Historical Line */}
                <Line
                  type="monotone"
                  dataKey="historical"
                  stroke="#334155"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#334155' }}
                  name="Historical Sales"
                />
                {/* Predicted Line */}
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#059669"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#059669' }}
                  name="Predicted Demand"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comparison Overview Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            Multi-Medicine Demand Forecast & Stockout Threat Matrix
          </h3>
          <p className="text-[11px] text-slate-500">
            Demonstration view of forecasted consumption vs current dispensary stock
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Medicine Name</th>
                <th className="py-3 px-3">Therapeutic Class</th>
                <th className="py-3 px-3">Current Stock</th>
                <th className="py-3 px-3">14-Day Projected Demand</th>
                <th className="py-3 px-3">Stock Deficit</th>
                <th className="py-3 px-3">Confidence</th>
                <th className="py-3 px-3">Surge Indicator</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DEMO_FORECASTS.map((f) => {
                const deficit = Math.max(0, f.predicted14DayDemand - f.currentStock)
                return (
                  <tr key={f.medicineId} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {f.medicineName}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                        {f.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                      {f.currentStock} units
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                      {f.predicted14DayDemand} units
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-rose-600">
                      -{deficit} units
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {f.confidenceScore}%
                    </td>
                    <td className="py-3 px-3">
                      {f.surgeTag ? (
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          {f.surgeTag}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Normal</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setCurrentPage('purchase-recommendations')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                      >
                        Reorder Deficit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
