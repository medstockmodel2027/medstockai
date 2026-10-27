import React from 'react'
import { useApp } from '../../context/AppContext'
import { NavigationPage } from '../../types'
import {
  LayoutDashboard,
  Boxes,
  Truck,
  Receipt,
  TrendingUp,
  ShieldAlert,
  ShoppingCart,
  Settings,
  ChevronLeft,
  ChevronRight,
  Pill,
  Database,
  Radio,
} from 'lucide-react'

interface NavItem {
  id: NavigationPage
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | string
  badgeVariant?: 'critical' | 'warning' | 'info' | 'success'
}

export const Sidebar: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    sidebarCollapsed,
    setSidebarCollapsed,
    lowStockCount,
    nearExpiryBatchesCount,
    recommendations,
  } = useApp()

  const pendingRecommendationsCount = recommendations.filter(
    (r) => r.status === 'PENDING' && (r.urgency === 'CRITICAL' || r.urgency === 'HIGH')
  ).length

  const totalRisksCount = lowStockCount + nearExpiryBatchesCount

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined,
      badgeVariant: 'warning',
    },
    {
      id: 'purchase-imports',
      label: 'Purchase Imports',
      icon: Truck,
    },
    {
      id: 'sales-imports',
      label: 'Sales Imports',
      icon: Receipt,
    },
    {
      id: 'demand-forecast',
      label: 'Demand Forecast',
      icon: TrendingUp,
    },
    {
      id: 'risk-center',
      label: 'Risk Center',
      icon: ShieldAlert,
      badge: totalRisksCount > 0 ? totalRisksCount : undefined,
      badgeVariant: 'critical',
    },
    {
      id: 'purchase-recommendations',
      label: 'Purchase Recs',
      icon: ShoppingCart,
      badge: pendingRecommendationsCount > 0 ? pendingRecommendationsCount : undefined,
      badgeVariant: 'critical',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ]

  return (
    <aside
      className={`relative bg-white border-r border-slate-200/80 flex flex-col transition-all duration-300 z-30 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Pill className="w-5 h-5 transform -rotate-45" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  MedStock
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 tracking-wider">
                  AI
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 truncate">
                Type C Pharmacy Ops
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors shrink-0"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!sidebarCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Management & Analytics
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all group relative ${
                isActive
                  ? 'bg-emerald-50 text-emerald-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-emerald-600 rounded-r-md" />
              )}
              <Icon
                className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                  isActive
                    ? 'text-emerald-700'
                    : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              {!sidebarCollapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.badgeVariant === 'critical'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Tooltip badge for collapsed state */}
              {sidebarCollapsed && item.badge !== undefined && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>
          )
        })}
      </div>

      {/* Marg ERP Sync Status Card */}
      <div className="p-3 border-t border-slate-100">
        {!sidebarCollapsed ? (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                Marg ERP 9+
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                Simulated Feed
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Counter 1 & 2 POS synced (Simulated).
            </p>
          </div>
        ) : (
          <div className="flex justify-center p-2 text-slate-400" title="Marg ERP 9+ Connected">
            <Database className="w-4 h-4 text-emerald-500" />
          </div>
        )}
      </div>
    </aside>
  )
}
