import React, { createContext, useContext, useState, useMemo, useCallback } from 'react'
import type {
  NavigationPage,
  Medicine,
  Batch,
  PurchaseInvoice,
  SalesImportBatch,
  PurchaseRecommendation,
  PharmacyProfile,
  NotificationItem,
  StockoutRiskItem,
  ExpiryRiskItem,
} from '../types'
import {
  INITIAL_MEDICINES,
  INITIAL_BATCHES,
  INITIAL_PURCHASE_INVOICES,
  INITIAL_SALES_IMPORTS,
  INITIAL_PURCHASE_RECOMMENDATIONS,
  INITIAL_PHARMACY_PROFILE,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData'

export interface ToastMessage {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface AppContextType {
  currentPage: NavigationPage
  setCurrentPage: (page: NavigationPage) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  medicines: Medicine[]
  batches: Batch[]
  purchaseInvoices: PurchaseInvoice[]
  salesImports: SalesImportBatch[]
  recommendations: PurchaseRecommendation[]
  pharmacyProfile: PharmacyProfile
  notifications: NotificationItem[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  isGlobalSearchOpen: boolean
  setIsGlobalSearchOpen: (open: boolean) => void
  isSyncingSales: boolean
  isImportingPurchase: boolean
  toasts: ToastMessage[]
  addToast: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  removeToast: (id: string) => void
  
  // Actions
  triggerSalesSync: () => Promise<void>
  triggerPurchaseImport: (newInvoice?: Partial<PurchaseInvoice>) => Promise<void>
  adjustMedicineStock: (medicineId: string, newTotalStock: number, reason: string) => void
  toggleRecommendationSelection: (id: string) => void
  toggleAllRecommendations: (select: boolean) => void
  updateRecommendationQty: (id: string, qty: number) => void
  approvePurchaseOrders: (ids: string[]) => void
  dismissRecommendation: (id: string) => void
  markBatchReturnProcessed: (batchId: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  updatePharmacyProfile: (profile: Partial<PharmacyProfile>) => void
  resetToMockData: () => void

  // Computed KPIs
  totalMedicines: number
  totalStockUnits: number
  lowStockCount: number
  nearExpiryBatchesCount: number
  inventoryValuation: number
  stockoutRisks: StockoutRiskItem[]
  expiryRisks: ExpiryRiskItem[]
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES)
  const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES)
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(INITIAL_PURCHASE_INVOICES)
  const [salesImports, setSalesImports] = useState<SalesImportBatch[]>(INITIAL_SALES_IMPORTS)
  const [recommendations, setRecommendations] = useState<PurchaseRecommendation[]>(INITIAL_PURCHASE_RECOMMENDATIONS)
  const [pharmacyProfile, setPharmacyProfile] = useState<PharmacyProfile>(INITIAL_PHARMACY_PROFILE)
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false)
  const [isSyncingSales, setIsSyncingSales] = useState<boolean>(false)
  const [isImportingPurchase, setIsImportingPurchase] = useState<boolean>(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    setToasts((prev) => [...prev, { id, title, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // KPI Calculations
  const totalMedicines = medicines.length
  
  const totalStockUnits = useMemo(() => {
    return medicines.reduce((sum, m) => sum + m.totalStock, 0)
  }, [medicines])

  const lowStockCount = useMemo(() => {
    return medicines.filter((m) => m.status === 'low_stock' || m.status === 'out_of_stock' || m.totalStock <= m.reorderLevel).length
  }, [medicines])

  const nearExpiryBatchesCount = useMemo(() => {
    return batches.filter((b) => b.status === 'near_expiry' || b.daysToExpiry <= pharmacyProfile.nearExpiryThresholdDays).length
  }, [batches, pharmacyProfile.nearExpiryThresholdDays])

  const inventoryValuation = useMemo(() => {
    return medicines.reduce((sum, m) => sum + m.totalStock * m.unitCost, 0)
  }, [medicines])

  const stockoutRisks = useMemo<StockoutRiskItem[]>(() => {
    return medicines
      .filter((m) => m.totalStock <= m.reorderLevel || m.daysOfSupply <= 5)
      .map((m) => {
        let urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'
        if (m.totalStock === 0 || m.daysOfSupply <= 2) urgency = 'CRITICAL'
        else if (m.daysOfSupply <= 4) urgency = 'HIGH'

        return {
          medicineId: m.id,
          medicineName: m.name,
          category: m.category,
          currentStock: m.totalStock,
          reorderLevel: m.reorderLevel,
          dailyVelocity: m.dailyVelocity,
          daysOfSupplyRemaining: Number(m.daysOfSupply.toFixed(1)),
          urgency,
          suggestedOrderQty: Math.max(m.reorderLevel * 2 - m.totalStock, 50),
          preferredSupplier: m.preferredSupplier,
          potentialRevenueLoss: Math.round(m.dailyVelocity * m.mrp * 7),
        }
      })
      .sort((a, b) => a.daysOfSupplyRemaining - b.daysOfSupplyRemaining)
  }, [medicines])

  const expiryRisks = useMemo<ExpiryRiskItem[]>(() => {
    return batches
      .filter((b) => b.daysToExpiry <= pharmacyProfile.nearExpiryThresholdDays)
      .map((b) => {
        let urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'
        if (b.daysToExpiry <= 0) urgency = 'CRITICAL'
        else if (b.daysToExpiry <= 30) urgency = 'HIGH'

        return {
          batchId: b.id,
          medicineId: b.medicineId,
          medicineName: b.medicineName,
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate,
          daysToExpiry: b.daysToExpiry,
          quantity: b.quantity,
          unitCost: b.unitCost,
          capitalAtRisk: Math.round(b.quantity * b.unitCost),
          supplierName: b.supplierName,
          returnWindowDays: b.returnEligible ? Math.max(0, b.daysToExpiry - 7) : 0,
          returnEligible: b.returnEligible,
          urgency,
        }
      })
      .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
  }, [batches, pharmacyProfile.nearExpiryThresholdDays])

  // Functional triggers
  const triggerSalesSync = useCallback(async () => {
    setIsSyncingSales(true)
    addToast('Marg ERP Sync Started', 'Streaming retail billing transactions from POS counters...', 'info')

    await new Promise((resolve) => setTimeout(resolve, 1100))

    // Fast-moving medicines sold in this simulated POS batch
    const soldItems = [
      { id: 'med-002', name: 'Dolo 650 Strip (15 Tab)', units: 14 },
      { id: 'med-001', name: 'Augmentin 625 Duo', units: 6 },
      { id: 'med-005', name: 'Pan-D Capsule (15 Cap)', units: 6 },
      { id: 'med-012', name: 'Ecosprin 75 Tablet', units: 8 },
    ]

    const totalUnitsSold = soldItems.reduce((sum, item) => sum + item.units, 0)
    const newBillsCount = Math.floor(Math.random() * 10) + 20
    const newRevenue = 6420

    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    const newSyncItem: SalesImportBatch = {
      id: `sales-batch-${Date.now().toString().slice(-4)}`,
      batchDate: `Today (Live Sync @ ${timeStr})`,
      importedAt: `Just now (${timeStr})`,
      source: 'Marg ERP POS',
      billCount: newBillsCount,
      unitsSold: totalUnitsSold,
      totalRevenue: newRevenue,
      taxCollected: Math.round(newRevenue * 0.12),
      status: 'Synced',
    }

    // Deduct inventory quantities from medicines ledger
    setMedicines((prev) =>
      prev.map((m) => {
        const sold = soldItems.find((s) => s.id === m.id)
        if (sold) {
          const newStock = Math.max(0, m.totalStock - sold.units)
          const newDays = m.dailyVelocity > 0 ? Number((newStock / m.dailyVelocity).toFixed(1)) : 0
          const status: 'in_stock' | 'low_stock' | 'out_of_stock' =
            newStock === 0 ? 'out_of_stock' : newStock <= m.reorderLevel ? 'low_stock' : 'in_stock'
          return {
            ...m,
            totalStock: newStock,
            daysOfSupply: newDays,
            status,
          }
        }
        return m
      })
    )

    // Deduct from oldest batch per medicine (FIFO order)
    setBatches((prev) => {
      const updatedBatches = [...prev]
      soldItems.forEach((sold) => {
        let remainingToDeduct = sold.units
        const medBatchIndices = updatedBatches
          .map((b, idx) => ({ ...b, originalIndex: idx }))
          .filter((b) => b.medicineId === sold.id)
          .sort((a, b) => a.daysToExpiry - b.daysToExpiry)

        for (const mb of medBatchIndices) {
          if (remainingToDeduct <= 0) break
          const deduct = Math.min(updatedBatches[mb.originalIndex].quantity, remainingToDeduct)
          updatedBatches[mb.originalIndex] = {
            ...updatedBatches[mb.originalIndex],
            quantity: Math.max(0, updatedBatches[mb.originalIndex].quantity - deduct),
          }
          remainingToDeduct -= deduct
        }
      })
      return updatedBatches
    })

    setSalesImports((prev) => [newSyncItem, ...prev])
    setIsSyncingSales(false)
    addToast(
      'Marg ERP POS Sync Complete',
      `Imported ${newBillsCount} sales bills (₹${newRevenue.toLocaleString('en-IN')}). Deducted ${totalUnitsSold} units across dispensary stock.`,
      'success'
    )
  }, [addToast])

  const triggerPurchaseImport = useCallback(
    async (invoiceData?: Partial<PurchaseInvoice>) => {
      const invoiceNum = invoiceData?.invoiceNumber || `DIST-BILL-${Math.floor(10000 + Math.random() * 90000)}`

      // Duplicate check
      const isDuplicate = purchaseInvoices.some(
        (inv) => inv.invoiceNumber.toLowerCase().trim() === invoiceNum.toLowerCase().trim()
      )
      if (isDuplicate) {
        addToast(
          'Duplicate Invoice Detected',
          `Invoice ${invoiceNum} has already been registered. Duplicate import prevented.`,
          'warning'
        )
        return
      }

      setIsImportingPurchase(true)
      addToast('Importing Purchase Bill', 'Parsing invoice and mapping GSTIN batch metadata...', 'info')

      await new Promise((resolve) => setTimeout(resolve, 1100))

      const supplier = invoiceData?.distributorName || 'Cipla Logistics Hub'

      type ImportItemDef = {
        medId: string
        medName: string
        batchPrefix: string
        qty: number
        free: number
        cost: number
        mrp: number
        rack: string
      }

      let lineItemDefs: ImportItemDef[] = []

      if (supplier.includes('Cipla')) {
        lineItemDefs = [
          { medId: 'med-008', medName: 'Montair-LC Tablet', batchPrefix: 'MON', qty: 60, free: 6, cost: 160.0, mrp: 242.0, rack: 'Rack C-01' },
          { medId: 'med-014', medName: 'Budecort 200 Inhaler', batchPrefix: 'BUD', qty: 25, free: 2, cost: 285.0, mrp: 410.0, rack: 'Rack C-02' },
        ]
      } else if (supplier.includes('Micro Labs')) {
        lineItemDefs = [
          { medId: 'med-002', medName: 'Dolo 650 Strip (15 Tab)', batchPrefix: 'DOL', qty: 200, free: 20, cost: 22.8, mrp: 34.0, rack: 'Rack B-01' },
        ]
      } else if (supplier.includes('GlaxoSmithKline')) {
        lineItemDefs = [
          { medId: 'med-001', medName: 'Augmentin 625 Duo', batchPrefix: 'AUG', qty: 100, free: 10, cost: 143.5, mrp: 204.0, rack: 'Rack A-02' },
        ]
      } else if (supplier.includes('Alkem')) {
        lineItemDefs = [
          { medId: 'med-005', medName: 'Pan-D Capsule (15 Cap)', batchPrefix: 'PND', qty: 80, free: 8, cost: 135.0, mrp: 199.0, rack: 'Rack C-03' },
          { medId: 'med-015', medName: 'Clavam 625 Tablet', batchPrefix: 'CLM', qty: 60, free: 6, cost: 138.0, mrp: 201.0, rack: 'Rack A-03' },
        ]
      } else {
        lineItemDefs = [
          { medId: 'med-006', medName: 'Rosuvas 10 Tablet', batchPrefix: 'ROS', qty: 80, free: 8, cost: 175.0, mrp: 260.0, rack: 'Rack B-02' },
          { medId: 'med-018', medName: 'Volini Pain Relief Gel 50g', batchPrefix: 'VOL', qty: 50, free: 5, cost: 110.0, mrp: 165.0, rack: 'Rack D-04' },
        ]
      }

      const taxableTotal = lineItemDefs.reduce((sum, item) => sum + item.qty * item.cost, 0)
      const gstAmount = Math.round(taxableTotal * 0.12)
      const grandTotal = taxableTotal + gstAmount

      const newInvoiceItems = lineItemDefs.map((def) => {
        const batchNum = `${def.batchPrefix}-26-${Math.floor(1000 + Math.random() * 9000)}`
        return {
          medicineName: def.medName,
          batchNumber: batchNum,
          quantity: def.qty,
          freeUnits: def.free,
          unitCost: def.cost,
          mrp: def.mrp,
          gstRate: 12,
          totalAmount: def.qty * def.cost,
          _meta: def,
        }
      })

      const newInvoice: PurchaseInvoice = {
        id: `inv-${Date.now().toString().slice(-4)}`,
        invoiceNumber: invoiceNum,
        distributorName: supplier,
        distributorGst: '19AAACS8819Q1ZP',
        invoiceDate: new Date().toISOString().split('T')[0],
        importedAt: 'Just now',
        itemsCount: newInvoiceItems.length,
        totalAmount: grandTotal,
        taxAmount: gstAmount,
        paymentStatus: 'Credit-30',
        sourceSystem: 'Marg ERP 9+',
        items: newInvoiceItems.map(({ _meta, ...rest }) => rest),
      }

      // Create new batch records and register them in batches state
      const createdBatches: Batch[] = newInvoiceItems.map((item, idx) => ({
        id: `batch-imp-${Date.now()}-${idx}`,
        medicineId: item._meta.medId,
        medicineName: item.medicineName,
        batchNumber: item.batchNumber,
        mfgDate: new Date().toISOString().split('T')[0],
        expiryDate: '2028-06-30',
        daysToExpiry: 610,
        quantity: item.quantity + item.freeUnits,
        unitCost: item.unitCost,
        mrp: item.mrp,
        supplierName: supplier,
        rackLocation: item._meta.rack,
        status: 'normal',
        returnEligible: true,
      }))

      setBatches((prev) => [...createdBatches, ...prev])

      // Restock the exact medicines received in the invoice
      setMedicines((prev) =>
        prev.map((m) => {
          const matchingItem = newInvoiceItems.find((item) => item._meta.medId === m.id)
          if (matchingItem) {
            const addedStock = matchingItem.quantity + matchingItem.freeUnits
            const newStock = m.totalStock + addedStock
            const newDays = m.dailyVelocity > 0 ? Number((newStock / m.dailyVelocity).toFixed(1)) : 0
            const status: 'in_stock' | 'low_stock' | 'out_of_stock' =
              newStock > m.reorderLevel ? 'in_stock' : 'low_stock'
            return {
              ...m,
              totalStock: newStock,
              daysOfSupply: newDays,
              status,
            }
          }
          return m
        })
      )

      setPurchaseInvoices((prev) => [newInvoice, ...prev])
      setIsImportingPurchase(false)
      addToast(
        'Purchase Bill Ingested',
        `Invoice ${invoiceNum} from ${supplier} (₹${grandTotal.toLocaleString('en-IN')}) registered. Credited ${createdBatches.length} new batches to dispensary.`,
        'success'
      )
    },
    [purchaseInvoices, addToast]
  )

  const adjustMedicineStock = useCallback(
    (medicineId: string, newTotalStock: number, reason: string) => {
      let targetMedName = ''
      setMedicines((prev) =>
        prev.map((m) => {
          if (m.id === medicineId) {
            targetMedName = m.name
            const days = m.dailyVelocity > 0 ? Number((newTotalStock / m.dailyVelocity).toFixed(1)) : 0
            const status: 'in_stock' | 'low_stock' | 'out_of_stock' =
              newTotalStock === 0 ? 'out_of_stock' : newTotalStock <= m.reorderLevel ? 'low_stock' : 'in_stock'
            return {
              ...m,
              totalStock: newTotalStock,
              daysOfSupply: days,
              status,
            }
          }
          return m
        })
      )

      // Also adjust primary batch quantity to maintain batch-to-stock parity
      setBatches((prev) => {
        const medBatches = prev.filter((b) => b.medicineId === medicineId)
        if (medBatches.length === 0) return prev
        const otherBatchesTotal = medBatches.slice(1).reduce((sum, b) => sum + b.quantity, 0)
        const primaryBatchNewQty = Math.max(0, newTotalStock - otherBatchesTotal)

        return prev.map((b) => {
          if (b.id === medBatches[0].id) {
            return { ...b, quantity: primaryBatchNewQty }
          }
          return b
        })
      })

      addToast(
        'Stock Adjusted & Audited',
        `${targetMedName || 'Medicine'} stock count updated to ${newTotalStock} units (${reason}).`,
        'success'
      )
    },
    [addToast]
  )

  const toggleRecommendationSelection = useCallback((id: string) => {
    setRecommendations((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, selected: !rec.selected } : rec))
    )
  }, [])

  const toggleAllRecommendations = useCallback((select: boolean) => {
    setRecommendations((prev) => prev.map((rec) => ({ ...rec, selected: select })))
  }, [])

  const updateRecommendationQty = useCallback((id: string, qty: number) => {
    setRecommendations((prev) =>
      prev.map((rec) =>
        rec.id === id
          ? {
              ...rec,
              suggestedQty: qty,
              totalCost: Math.round(qty * rec.unitCost),
            }
          : rec
      )
    )
  }, [])

  const approvePurchaseOrders = useCallback(
    (ids: string[]) => {
      setRecommendations((prev) =>
        prev.map((rec) => (ids.includes(rec.id) ? { ...rec, status: 'ORDERED', selected: false } : rec))
      )
      addToast(
        'Purchase Order Dispatched',
        `Generated PO Draft for ${ids.length} selected medicines. Sent to distributor portal simulator.`,
        'success'
      )
    },
    [addToast]
  )

  const dismissRecommendation = useCallback(
    (id: string) => {
      setRecommendations((prev) =>
        prev.map((rec) => (rec.id === id ? { ...rec, status: 'DISMISSED', selected: false } : rec))
      )
      addToast('Recommendation Dismissed', 'Item removed from active purchase queue.', 'info')
    },
    [addToast]
  )

  const markBatchReturnProcessed = useCallback(
    (batchId: string) => {
      const targetBatch = batches.find((b) => b.id === batchId)
      if (!targetBatch) return

      // Remove the batch from batches state
      setBatches((prev) => prev.filter((b) => b.id !== batchId))

      // Deduct returned quantity from the medicine's totalStock
      setMedicines((prev) =>
        prev.map((m) => {
          if (m.id === targetBatch.medicineId) {
            const newStock = Math.max(0, m.totalStock - targetBatch.quantity)
            const newDays = m.dailyVelocity > 0 ? Number((newStock / m.dailyVelocity).toFixed(1)) : 0
            const status: 'in_stock' | 'low_stock' | 'out_of_stock' =
              newStock === 0 ? 'out_of_stock' : newStock <= m.reorderLevel ? 'low_stock' : 'in_stock'
            return {
              ...m,
              totalStock: newStock,
              daysOfSupply: newDays,
              status,
            }
          }
          return m
        })
      )

      addToast(
        'Return Note Drafted',
        `Draft return note generated for Batch ${targetBatch.batchNumber} (${targetBatch.quantity} units). Removed from active dispensary stock.`,
        'success'
      )
    },
    [batches, addToast]
  )

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const updatePharmacyProfile = useCallback((profile: Partial<PharmacyProfile>) => {
    setPharmacyProfile((prev) => ({ ...prev, ...profile }))
  }, [])

  const resetToMockData = useCallback(() => {
    setMedicines(INITIAL_MEDICINES)
    setBatches(INITIAL_BATCHES)
    setPurchaseInvoices(INITIAL_PURCHASE_INVOICES)
    setSalesImports(INITIAL_SALES_IMPORTS)
    setRecommendations(INITIAL_PURCHASE_RECOMMENDATIONS)
    setPharmacyProfile(INITIAL_PHARMACY_PROFILE)
    setNotifications(INITIAL_NOTIFICATIONS)
    addToast('Reset Complete', 'All pharmacy inventory data reverted to original demonstration state.', 'info')
  }, [addToast])

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        sidebarCollapsed,
        setSidebarCollapsed,
        medicines,
        batches,
        purchaseInvoices,
        salesImports,
        recommendations,
        pharmacyProfile,
        notifications,
        searchQuery,
        setSearchQuery,
        isGlobalSearchOpen,
        setIsGlobalSearchOpen,
        isSyncingSales,
        isImportingPurchase,
        toasts,
        addToast,
        removeToast,
        triggerSalesSync,
        triggerPurchaseImport,
        adjustMedicineStock,
        toggleRecommendationSelection,
        toggleAllRecommendations,
        updateRecommendationQty,
        approvePurchaseOrders,
        dismissRecommendation,
        markBatchReturnProcessed,
        markNotificationRead,
        markAllNotificationsRead,
        updatePharmacyProfile,
        resetToMockData,
        totalMedicines,
        totalStockUnits,
        lowStockCount,
        nearExpiryBatchesCount,
        inventoryValuation,
        stockoutRisks,
        expiryRisks,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
