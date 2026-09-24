// Shared domain types for SS Jewellery ERP

export type MetalType = 'GOLD' | 'SILVER' | 'DIAMOND' | 'PLATINUM' | 'OTHER'
export type KaratType = '24K' | '22K' | '18K' | '14K' | '925' | 'PT950' | 'NA'
export type ItemCategory =
  | 'Necklace'
  | 'Bangle'
  | 'Ring'
  | 'Earring'
  | 'Chain'
  | 'Pendant'
  | 'Bracelet'
  | 'Mangalsutra'
  | 'Nose Pin'
  | 'Anklet'
  | 'Coin'
  | 'Idol'
  | 'Other'

export interface InventoryItem {
  id: string
  name: string
  sku: string
  category: ItemCategory
  metal: MetalType
  karat: KaratType
  grossWeight: number // grams
  netWeight: number // grams (after stone/deduction)
  stoneWeight: number // grams
  stoneValue: number // ₹
  makingChargeType: 'PERCENT' | 'PER_GRAM' | 'FIXED'
  makingChargeValue: number
  touch: number // purity percentage for gold (e.g. 91.6 for 22K)
  costPrice: number // ₹
  sellingPrice: number // ₹ (with making + stone)
  stock: number
  branch: string
  imageColor?: string // tailwind gradient class for thumbnail
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  city?: string
  pincode?: string
  gstin?: string
  pan?: string
  dateOfBirth?: string
  anniversary?: string
  totalPurchase: number
  totalBills: number
  createdAt: string
}

export interface SaleItem {
  itemId: string
  name: string
  sku: string
  metal: MetalType
  karat: KaratType
  grossWeight: number
  netWeight: number
  makingAmount: number
  stoneValue: number
  metalValue: number
  subtotal: number
  quantity: number
}

export type PaymentMode = 'CASH' | 'CARD' | 'UPI' | 'BANK' | 'CHEQUE' | 'CREDIT'

export interface Sale {
  id: string
  invoiceNo: string
  customerId: string
  customerName: string
  customerPhone: string
  items: SaleItem[]
  totalMetalValue: number
  totalMaking: number
  totalStone: number
  subTotal: number
  gstRate: number // %
  gstAmount: number
  oldGoldAdjustment: number
  discount: number
  grandTotal: number
  paymentMode: PaymentMode
  paymentRef?: string
  status: 'PAID' | 'PARTIAL' | 'CREDIT' | 'CANCELLED'
  amountPaid: number
  branch: string
  billedBy: string
  createdAt: string
}

export type KarigarStatus = 'ACTIVE' | 'INACTIVE'

export interface Karigar {
  id: string
  name: string
  phone: string
  specialty: ItemCategory
  rating: number // out of 5
  totalOrders: number
  pendingOrders: number
  outstandingPayment: number // ₹
  status: KarigarStatus
  address?: string
  createdAt: string
}

export type WorkOrderStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED'

export interface WorkOrder {
  id: string
  orderNo: string
  karigarId: string
  karigarName: string
  customerName?: string
  itemDescription: string
  category: ItemCategory
  metal: MetalType
  karat: KaratType
  givenWeight: number // grams given to karigar
  expectedWeight: number // grams expected back
  receivedWeight?: number
  makingCharge: number
  dueDate: string
  status: WorkOrderStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export type ExchangeType = 'BUY' | 'EXCHANGE'

export interface OldGoldExchange {
  id: string
  voucherNo: string
  customerName: string
  customerPhone: string
  type: ExchangeType
  itemDescription: string
  grossWeight: number
  netWeight: number
  karat: KaratType
  touch: number
  ratePerGram: number
  totalValue: number
  adjustedAgainstInvoice?: string
  paidAmount: number
  date: string
  createdAt: string
}

export interface ShopSettings {
  shopName: string
  ownerName: string
  phone: string
  email: string
  address: string
  city: string
  pincode: string
  gstin: string
  pan: string
  defaultGstRate: number
  defaultGoldRate24K: number // ₹ per gram (24K)
  defaultSilverRate: number // ₹ per kg
  branch: string
  currency: string
}

export const METAL_OPTIONS: { value: MetalType; label: string; color: string }[] = [
  { value: 'GOLD', label: 'Gold', color: 'text-amber-600 dark:text-amber-400' },
  { value: 'SILVER', label: 'Silver', color: 'text-slate-500' },
  { value: 'DIAMOND', label: 'Diamond', color: 'text-cyan-600 dark:text-cyan-400' },
  { value: 'PLATINUM', label: 'Platinum', color: 'text-zinc-500' },
  { value: 'OTHER', label: 'Other', color: 'text-rose-600 dark:text-rose-400' },
]

export const KARAT_OPTIONS: KaratType[] = ['24K', '22K', '18K', '14K', '925', 'PT950', 'NA']

export const CATEGORY_OPTIONS: ItemCategory[] = [
  'Necklace', 'Bangle', 'Ring', 'Earring', 'Chain', 'Pendant',
  'Bracelet', 'Mangalsutra', 'Nose Pin', 'Anklet', 'Coin', 'Idol', 'Other',
]

export const PAYMENT_OPTIONS: { value: PaymentMode; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CREDIT', label: 'Credit' },
]
