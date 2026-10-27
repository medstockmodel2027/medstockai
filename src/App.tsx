import React from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { Sidebar } from './components/layout/Sidebar'
import { TopNavbar } from './components/layout/TopNavbar'
import { DemoDisclaimer } from './components/layout/DemoDisclaimer'
import { GlobalSearchModal } from './components/common/GlobalSearchModal'
import { ToastContainer } from './components/common/Toast'

// Pages
import { DashboardPage } from './components/pages/DashboardPage'
import { InventoryPage } from './components/pages/InventoryPage'
import { PurchaseImportsPage } from './components/pages/PurchaseImportsPage'
import { SalesImportsPage } from './components/pages/SalesImportsPage'
import { DemandForecastPage } from './components/pages/DemandForecastPage'
import { RiskCenterPage } from './components/pages/RiskCenterPage'
import { PurchaseRecommendationsPage } from './components/pages/PurchaseRecommendationsPage'
import { SettingsPage } from './components/pages/SettingsPage'

const MainAppLayout: React.FC = () => {
  const { currentPage } = useApp()

  const renderActivePage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />
      case 'inventory':
        return <InventoryPage />
      case 'purchase-imports':
        return <PurchaseImportsPage />
      case 'sales-imports':
        return <SalesImportsPage />
      case 'demand-forecast':
        return <DemandForecastPage />
      case 'risk-center':
        return <RiskCenterPage />
      case 'purchase-recommendations':
        return <PurchaseRecommendationsPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Demonstration Notice Banner */}
      <DemoDisclaimer />

      {/* Main Workspace with Sidebar + Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Collapsible Sidebar */}
        <Sidebar />

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Navbar */}
          <TopNavbar />

          {/* Dynamic Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {renderActivePage()}
          </main>

          {/* Footer note */}
          <footer className="px-6 py-4 border-t border-slate-200/60 text-center text-xs text-slate-400 bg-white/60">
            MedStock AI — Type C Retail Pharmacy Operations Dashboard (Phase 1 Frontend Prototype) • Mock Data Engine
          </footer>
        </div>
      </div>

      {/* Global Interactive Elements */}
      <GlobalSearchModal />
      <ToastContainer />
    </div>
  )
}

export function App() {
  return (
    <AppProvider>
      <MainAppLayout />
    </AppProvider>
  )
}

export default App
