'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  InventoryItem,
  Customer,
  Sale,
  Karigar,
  WorkOrder,
  OldGoldExchange,
  ShopSettings,
} from './types'
import {
  DEFAULT_SETTINGS,
  SEED_INVENTORY,
  SEED_CUSTOMERS,
  SEED_SALES,
  SEED_KARIGARS,
  SEED_WORK_ORDERS,
  SEED_EXCHANGES,
} from './seed-data'

const genId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

interface JewelleryState {
  // collections
  inventory: InventoryItem[]
  customers: Customer[]
  sales: Sale[]
  karigars: Karigar[]
  workOrders: WorkOrder[]
  exchanges: OldGoldExchange[]
  settings: ShopSettings
  invoiceSeq: number
  voucherSeq: number
  workOrderSeq: number
  seeded: boolean

  // actions
  hydrateSeed: () => void
  resetAll: () => void

  // inventory
  addInventory: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => InventoryItem
  updateInventory: (id: string, patch: Partial<InventoryItem>) => void
  deleteInventory: (id: string) => void
  decrementStock: (id: string, qty: number) => void

  // customers
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt' | 'totalPurchase' | 'totalBills'>) => Customer
  updateCustomer: (id: string, patch: Partial<Customer>) => void
  deleteCustomer: (id: string) => void
  bumpCustomerStats: (id: string, amount: number) => void

  // sales
  addSale: (sale: Omit<Sale, 'id' | 'invoiceNo' | 'createdAt'>) => Sale
  updateSale: (id: string, patch: Partial<Sale>) => void
  deleteSale: (id: string) => void

  // karigars
  addKarigar: (k: Omit<Karigar, 'id' | 'createdAt' | 'totalOrders' | 'pendingOrders' | 'outstandingPayment'>) => Karigar
  updateKarigar: (id: string, patch: Partial<Karigar>) => void
  deleteKarigar: (id: string) => void

  // work orders
  addWorkOrder: (wo: Omit<WorkOrder, 'id' | 'orderNo' | 'createdAt' | 'updatedAt'>) => WorkOrder
  updateWorkOrder: (id: string, patch: Partial<WorkOrder>) => void
  deleteWorkOrder: (id: string) => void

  // exchanges
  addExchange: (ex: Omit<OldGoldExchange, 'id' | 'voucherNo' | 'createdAt'>) => OldGoldExchange
  updateExchange: (id: string, patch: Partial<OldGoldExchange>) => void
  deleteExchange: (id: string) => void

  // settings
  updateSettings: (patch: Partial<ShopSettings>) => void
}

export const useJewelleryStore = create<JewelleryState>()(
  persist(
    (set, get) => ({
      inventory: [],
      customers: [],
      sales: [],
      karigars: [],
      workOrders: [],
      exchanges: [],
      settings: DEFAULT_SETTINGS,
      invoiceSeq: 6,
      voucherSeq: 11,
      workOrderSeq: 15,
      seeded: false,

      hydrateSeed: () => {
        if (get().seeded) return
        set({
          inventory: SEED_INVENTORY,
          customers: SEED_CUSTOMERS,
          sales: SEED_SALES,
          karigars: SEED_KARIGARS,
          workOrders: SEED_WORK_ORDERS,
          exchanges: SEED_EXCHANGES,
          settings: DEFAULT_SETTINGS,
          seeded: true,
        })
      },

      resetAll: () => {
        set({
          inventory: SEED_INVENTORY,
          customers: SEED_CUSTOMERS,
          sales: SEED_SALES,
          karigars: SEED_KARIGARS,
          workOrders: SEED_WORK_ORDERS,
          exchanges: SEED_EXCHANGES,
          settings: DEFAULT_SETTINGS,
          invoiceSeq: 6,
          voucherSeq: 11,
          workOrderSeq: 15,
          seeded: true,
        })
      },

      addInventory: (item) => {
        const nowIso = new Date().toISOString()
        const newItem: InventoryItem = {
          ...item,
          id: genId('inv'),
          createdAt: nowIso,
          updatedAt: nowIso,
        }
        set((s) => ({ inventory: [newItem, ...s.inventory] }))
        return newItem
      },

      updateInventory: (id, patch) =>
        set((s) => ({
          inventory: s.inventory.map((it) =>
            it.id === id ? { ...it, ...patch, updatedAt: new Date().toISOString() } : it,
          ),
        })),

      deleteInventory: (id) =>
        set((s) => ({ inventory: s.inventory.filter((it) => it.id !== id) })),

      decrementStock: (id, qty) =>
        set((s) => ({
          inventory: s.inventory.map((it) =>
            it.id === id ? { ...it, stock: Math.max(0, it.stock - qty) } : it,
          ),
        })),

      addCustomer: (c) => {
        const newC: Customer = {
          ...c,
          id: genId('cus'),
          totalPurchase: 0,
          totalBills: 0,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ customers: [newC, ...s.customers] }))
        return newC
      },

      updateCustomer: (id, patch) =>
        set((s) => ({
          customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      deleteCustomer: (id) =>
        set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),

      bumpCustomerStats: (id, amount) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === id
              ? { ...c, totalPurchase: c.totalPurchase + amount, totalBills: c.totalBills + 1 }
              : c,
          ),
        })),

      addSale: (sale) => {
        const seq = get().invoiceSeq
        const year = new Date().getFullYear()
        const invoiceNo = `SSJ-${year}-${String(seq).padStart(4, '0')}`
        const newSale: Sale = {
          ...sale,
          id: genId('sale'),
          invoiceNo,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({
          sales: [newSale, ...s.sales],
          invoiceSeq: seq + 1,
        }))
        // decrement stock for items
        newSale.items.forEach((it) => get().decrementStock(it.itemId, it.quantity))
        // bump customer stats
        if (newSale.customerId) {
          get().bumpCustomerStats(newSale.customerId, newSale.grandTotal)
        }
        return newSale
      },

      updateSale: (id, patch) =>
        set((s) => ({
          sales: s.sales.map((sl) => (sl.id === id ? { ...sl, ...patch } : sl)),
        })),

      deleteSale: (id) =>
        set((s) => ({ sales: s.sales.filter((sl) => sl.id !== id) })),

      addKarigar: (k) => {
        const newK: Karigar = {
          ...k,
          id: genId('kar'),
          totalOrders: 0,
          pendingOrders: 0,
          outstandingPayment: 0,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ karigars: [newK, ...s.karigars] }))
        return newK
      },

      updateKarigar: (id, patch) =>
        set((s) => ({
          karigars: s.karigars.map((k) => (k.id === id ? { ...k, ...patch } : k)),
        })),

      deleteKarigar: (id) =>
        set((s) => ({ karigars: s.karigars.filter((k) => k.id !== id) })),

      addWorkOrder: (wo) => {
        const seq = get().workOrderSeq
        const orderNo = `WO-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`
        const nowIso = new Date().toISOString()
        const newWo: WorkOrder = {
          ...wo,
          id: genId('wo'),
          orderNo,
          createdAt: nowIso,
          updatedAt: nowIso,
        }
        set((s) => ({
          workOrders: [newWo, ...s.workOrders],
          workOrderSeq: seq + 1,
        }))
        // bump karigar pending orders
        if (newWo.status === 'PENDING' || newWo.status === 'IN_PROGRESS') {
          get().updateKarigar(newWo.karigarId, {
            pendingOrders: (get().karigars.find((k) => k.id === newWo.karigarId)?.pendingOrders ?? 0) + 1,
          })
        }
        return newWo
      },

      updateWorkOrder: (id, patch) =>
        set((s) => ({
          workOrders: s.workOrders.map((wo) =>
            wo.id === id ? { ...wo, ...patch, updatedAt: new Date().toISOString() } : wo,
          ),
        })),

      deleteWorkOrder: (id) =>
        set((s) => ({ workOrders: s.workOrders.filter((wo) => wo.id !== id) })),

      addExchange: (ex) => {
        const seq = get().voucherSeq
        const voucherNo = `EX-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`
        const newEx: OldGoldExchange = {
          ...ex,
          id: genId('ex'),
          voucherNo,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({
          exchanges: [newEx, ...s.exchanges],
          voucherSeq: seq + 1,
        }))
        return newEx
      },

      updateExchange: (id, patch) =>
        set((s) => ({
          exchanges: s.exchanges.map((ex) => (ex.id === id ? { ...ex, ...patch } : ex)),
        })),

      deleteExchange: (id) =>
        set((s) => ({ exchanges: s.exchanges.filter((ex) => ex.id !== id) })),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: 'ss-jewellery-store-v1',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          // SSR-safe noop
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          }
        }
        return window.localStorage
      }),
      onRehydrateStorage: () => (state) => {
        // If nothing was persisted yet, hydrate with seed data
        if (state && !state.seeded) {
          state.hydrateSeed()
        }
      },
    },
  ),
)

// Selectors / helpers
export const formatCurrency = (n: number, currency = '₹') => {
  if (!Number.isFinite(n)) return `${currency}0`
  // Indian number format with 2 decimals
  const fixed = Math.round(n * 100) / 100
  const [whole, frac] = fixed.toFixed(2).split('.')
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${currency}${withCommas}.${frac}`
}

export const formatCompact = (n: number, currency = '₹') => {
  if (n >= 10000000) return `${currency}${(n / 10000000).toFixed(2)}Cr`
  if (n >= 100000) return `${currency}${(n / 100000).toFixed(2)}L`
  if (n >= 1000) return `${currency}${(n / 1000).toFixed(1)}k`
  return `${currency}${n.toFixed(0)}`
}

export const formatDate = (iso: string) => {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export const formatDateTime = (iso: string) => {
  try {
    const d = new Date(iso)
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const d = Math.floor(hrs / 24)
  if (d < 30) return `${d}d ago`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}mo ago`
  return `${Math.floor(mo / 12)}y ago`
}
