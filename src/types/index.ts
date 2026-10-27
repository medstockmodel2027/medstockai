export type NavigationPage = 
  | 'dashboard'
  | 'inventory'
  | 'purchase-imports'
  | 'sales-imports'
  | 'demand-forecast'
  | 'risk-center'
  | 'purchase-recommendations'
  | 'settings'

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'
export type ExpiryStatus = 'normal' | 'near_expiry' | 'expired'
export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface Batch {
  id: string
  medicineId: string
  medicineName: string
  batchNumber: string
  mfgDate: string
  expiryDate: string
  daysToExpiry: number
  quantity: number
  unitCost: number
  mrp: number
  supplierName: string
  rackLocation: string
  status: ExpiryStatus
  returnEligible: boolean
}

export interface Medicine {
  id: string
  name: string
  genericName: string
  category: string
  dosageForm: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Ointment' | 'Inhaler' | 'Drops'
  totalStock: number
  unit: string
  reorderLevel: number
  safetyStock: number
  unitCost: number
  mrp: number
  preferredSupplier: string
  leadTimeDays: number
  dailyVelocity: number // average units sold per day
  daysOfSupply: number
  status: StockStatus
  batches: Batch[]
}

export interface StockoutRiskItem {
  medicineId: string
  medicineName: string
  category: string
  currentStock: number
  reorderLevel: number
  dailyVelocity: number
  daysOfSupplyRemaining: number
  urgency: UrgencyLevel
  suggestedOrderQty: number
  preferredSupplier: string
  potentialRevenueLoss: number
}

export interface ExpiryRiskItem {
  batchId: string
  medicineId: string
  medicineName: string
  batchNumber: string
  expiryDate: string
  daysToExpiry: number
  quantity: number
  unitCost: number
  capitalAtRisk: number
  supplierName: string
  returnWindowDays: number
  returnEligible: boolean
  urgency: UrgencyLevel
}

export interface PurchaseInvoiceItem {
  medicineName: string
  batchNumber: string
  quantity: number
  freeUnits: number
  unitCost: number
  mrp: number
  gstRate: number
  totalAmount: number
}

export interface PurchaseInvoice {
  id: string
  invoiceNumber: string
  distributorName: string
  distributorGst: string
  invoiceDate: string
  importedAt: string
  itemsCount: number
  totalAmount: number
  taxAmount: number
  paymentStatus: 'Paid' | 'Credit-30' | 'Pending'
  sourceSystem: 'Marg ERP 9+' | 'Tally Prime' | 'Vyapar' | 'Manual CSV'
  items: PurchaseInvoiceItem[]
}

export interface SalesImportBatch {
  id: string
  batchDate: string
  importedAt: string
  source: 'Marg ERP POS' | 'Tally Sync' | 'Vyapar Live' | 'POS CSV'
  billCount: number
  unitsSold: number
  totalRevenue: number
  taxCollected: number
  status: 'Synced' | 'Processing' | 'Flagged Discrepancy'
  discrepancyNote?: string
}

export interface ForecastPoint {
  date: string
  actual?: number
  predicted?: number
  upperBand?: number
  lowerBand?: number
}

export interface MedicineForecast {
  medicineId: string
  medicineName: string
  genericName: string
  category: string
  currentStock: number
  predicted14DayDemand: number
  confidenceScore: number
  surgeTag?: string
  trend: 'UP' | 'DOWN' | 'STABLE'
  historicalSales: { date: string; units: number }[]
  forecastPoints: ForecastPoint[]
}

export interface PurchaseRecommendation {
  id: string
  medicineId: string
  medicineName: string
  genericName: string
  category: string
  preferredSupplier: string
  currentStock: number
  suggestedQty: number
  packSize: number
  unitCost: number
  totalCost: number
  urgency: UrgencyLevel
  runoutDate: string
  reason: string
  selected: boolean
  status: 'PENDING' | 'ORDERED' | 'DISMISSED'
}

export interface PharmacyProfile {
  pharmacyName: string
  branchName: string
  pharmacyType: string
  drugLicenseNo: string
  gstin: string
  pharmacistInCharge: string
  address: string
  phone: string
  email: string
  billingSoftware: 'Marg ERP 9+' | 'Tally Prime' | 'Vyapar' | 'Custom CSV POS'
  syncMode: 'Automated Real-time (Simulated)' | 'Daily Scheduled' | 'Manual Upload'
  lowStockThresholdDays: number
  nearExpiryThresholdDays: number
  currencySymbol: string
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  timestamp: string
  type: 'critical' | 'warning' | 'info' | 'success'
  read: boolean
  actionPage?: NavigationPage
}
