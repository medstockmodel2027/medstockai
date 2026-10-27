import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import {
  Search,
  Bell,
  RefreshCw,
  Building2,
  CheckCheck,
  ChevronDown,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'

export const TopNavbar: React.FC = () => {
  const {
    pharmacyProfile,
    notifications,
    setIsGlobalSearchOpen,
    triggerSalesSync,
    isSyncingSales,
    markNotificationRead,
    markAllNotificationsRead,
    setCurrentPage,
  } = useApp()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Pharmacy Name & Branch */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                {pharmacyProfile.pharmacyName}
              </h1>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                Type C Retail
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {pharmacyProfile.branchName} • Marg ERP ID: 94821
            </p>
          </div>
        </div>
      </div>

      {/* Center: Search Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={() => setIsGlobalSearchOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-400 hover:text-slate-600 transition-colors group cursor-text"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            <span>Search medicines, salts, batches, or invoices...</span>
          </div>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs text-slate-400">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Icon */}
        <button
          onClick={() => setIsGlobalSearchOpen(true)}
          className="md:hidden p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Sync Trigger Button */}
        <button
          onClick={() => triggerSalesSync()}
          disabled={isSyncingSales}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/80 transition-colors disabled:opacity-50"
          title="Simulate sales bill import from Marg ERP"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSales ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {isSyncingSales ? 'Syncing...' : 'Sync POS'}
          </span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-3 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                  <p className="text-[11px] text-slate-500">{unreadCount} unread pharmacy alerts</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3.5 transition-colors cursor-pointer ${
                      notif.read ? 'bg-white hover:bg-slate-50/80 opacity-70' : 'bg-emerald-50/20 hover:bg-emerald-50/40'
                    }`}
                    onClick={() => {
                      markNotificationRead(notif.id)
                      if (notif.actionPage) {
                        setCurrentPage(notif.actionPage)
                        setShowNotifications(false)
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            notif.type === 'critical'
                              ? 'bg-rose-500'
                              : notif.type === 'warning'
                              ? 'bg-amber-500'
                              : notif.type === 'success'
                              ? 'bg-emerald-500'
                              : 'bg-sky-500'
                          }`}
                        />
                        <h5 className="text-xs font-bold text-slate-900">{notif.title}</h5>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{notif.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 pl-3.5 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                ))}
              </div>

              <div className="px-4 pt-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setCurrentPage('risk-center')
                    setShowNotifications(false)
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  View all in Risk Center →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/30">
              RK
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {pharmacyProfile.pharmacistInCharge.split(' ')[0]} {pharmacyProfile.pharmacistInCharge.split(' ')[1]}
              </div>
              <div className="text-[10px] text-slate-500 leading-none">Chief Pharmacist</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{pharmacyProfile.pharmacistInCharge}</p>
                <p className="text-[11px] text-slate-500 truncate">{pharmacyProfile.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setCurrentPage('settings')
                    setShowUserMenu(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                  Pharmacy Settings
                </button>
                <div className="px-4 py-2 text-[11px] text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>License: {pharmacyProfile.drugLicenseNo.slice(0, 14)}...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
