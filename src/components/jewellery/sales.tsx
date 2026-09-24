'use client'

import * as React from 'react'
import {
  Plus,
  Search,
  ReceiptIndianRupee,
  Trash2,
  Eye,
  Printer,
  Gem,
  X,
  User,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useJewelleryStore, formatCurrency, formatDateTime, formatDate } from '@/lib/store'
import { PAYMENT_OPTIONS, type PaymentMode, type Sale, type SaleItem, type MetalType } from '@/lib/types'
import { toast } from 'sonner'
import { StatusBadge } from './dashboard'

const PAGE_SIZE = 8

export function SalesView() {
  const { sales, customers, inventory, settings, addSale, deleteSale } = useJewelleryStore()
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL')
  const [page, setPage] = React.useState(1)
  const [newOpen, setNewOpen] = React.useState(false)
  const [viewSale, setViewSale] = React.useState<Sale | null>(null)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const filtered = React.useMemo(() => {
    return sales.filter((s) => {
      const q = search.trim().toLowerCase()
      const matchQ = !q || s.invoiceNo.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q) || s.customerPhone.includes(q)
      const matchS = statusFilter === 'ALL' || s.status === statusFilter
      return matchQ && matchS
    })
  }, [sales, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  React.useEffect(() => { if (page > totalPages) setPage(1) }, [page, totalPages])

  const stats = React.useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todaySales = sales.filter((s) => new Date(s.createdAt) >= todayStart)
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const monthSales = sales.filter((s) => new Date(s.createdAt) >= monthStart)
    const unpaid = sales.filter((s) => s.status !== 'PAID' && s.status !== 'CANCELLED')
      .reduce((sum, s) => sum + (s.grandTotal - s.amountPaid), 0)
    return {
      today: todaySales.reduce((sum, s) => sum + s.grandTotal, 0),
      todayBills: todaySales.length,
      month: monthSales.reduce((sum, s) => sum + s.grandTotal, 0),
      unpaid,
    }
  }, [sales])

  const handleDelete = () => {
    if (!deleteId) return
    deleteSale(deleteId)
    toast.success('Bill deleted')
    setDeleteId(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ReceiptIndianRupee className="h-5 w-5 text-primary" />
            Sales & Invoicing
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sales.length} total bills · {stats.todayBills} today
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />
          New Bill
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground">Today&apos;s Sales</p>
          <p className="text-base md:text-lg font-bold mt-0.5">{formatCurrency(stats.today, settings.currency)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground">This Month</p>
          <p className="text-base md:text-lg font-bold mt-0.5">{formatCurrency(stats.month, settings.currency)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground">Unpaid Balance</p>
          <p className="text-base md:text-lg font-bold mt-0.5 text-rose-600 dark:text-rose-400">{formatCurrency(stats.unpaid, settings.currency)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground">Total Bills</p>
          <p className="text-base md:text-lg font-bold mt-0.5">{sales.length}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by invoice no, customer name or phone…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="CREDIT">Credit</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bills list */}
      {pageItems.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <ReceiptIndianRupee className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground mt-3">No bills match your filters</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {pageItems.map((s) => (
            <Card key={s.id} className="overflow-hidden hover:shadow-sm transition-shadow">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{s.invoiceNo}</p>
                      <StatusBadge status={s.status} />
                      <Badge variant="outline" className="text-[10px]">{s.paymentMode}</Badge>
                    </div>
                    <p className="text-sm mt-0.5 truncate">{s.customerName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {s.customerPhone} · {formatDateTime(s.createdAt)} · {s.items.length} item{s.items.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base md:text-lg font-bold">{formatCurrency(s.grandTotal, settings.currency)}</p>
                    {s.status === 'PARTIAL' && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400">
                        Due: {formatCurrency(s.grandTotal - s.amountPaid, settings.currency)}
                      </p>
                    )}
                    <div className="flex justify-end gap-1 mt-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewSale(s)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(s.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      )}

      {/* New bill dialog */}
      <NewBillDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        customers={customers}
        inventory={inventory}
        settings={settings}
        onSave={(sale) => {
          addSale(sale)
          toast.success(`Bill ${sale.invoiceNo ?? ''} created`)
          setNewOpen(false)
        }}
      />

      {/* View dialog */}
      <ViewBillDialog sale={viewSale} onClose={() => setViewSale(null)} settings={settings} />

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this bill?</AlertDialogTitle>
            <AlertDialogDescription>
              The bill will be removed permanently. Stock levels will not be restored automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function NewBillDialog({
  open,
  onOpenChange,
  customers,
  inventory,
  settings,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  customers: ReturnType<typeof useJewelleryStore.getState>['customers']
  inventory: ReturnType<typeof useJewelleryStore.getState>['inventory']
  settings: ReturnType<typeof useJewelleryStore.getState>['settings']
  onSave: (sale: Omit<Sale, 'id' | 'invoiceNo' | 'createdAt'>) => void
}) {
  const [customerId, setCustomerId] = React.useState('')
  const [customerName, setCustomerName] = React.useState('')
  const [customerPhone, setCustomerPhone] = React.useState('')
  const [items, setItems] = React.useState<SaleItem[]>([])
  const [gstRate, setGstRate] = React.useState(settings.defaultGstRate)
  const [oldGoldAdj, setOldGoldAdj] = React.useState(0)
  const [discount, setDiscount] = React.useState(0)
  const [paymentMode, setPaymentMode] = React.useState<PaymentMode>('CASH')
  const [paymentRef, setPaymentRef] = React.useState('')
  const [amountPaid, setAmountPaid] = React.useState(0)
  const [status, setStatus] = React.useState<Sale['status']>('PAID')

  React.useEffect(() => {
    if (open) {
      setCustomerId(''); setCustomerName(''); setCustomerPhone('')
      setItems([]); setGstRate(settings.defaultGstRate); setOldGoldAdj(0); setDiscount(0)
      setPaymentMode('CASH'); setPaymentRef(''); setAmountPaid(0); setStatus('PAID')
    }
  }, [open, settings.defaultGstRate])

  const selectCustomer = (id: string) => {
    setCustomerId(id)
    const c = customers.find((c) => c.id === id)
    if (c) {
      setCustomerName(c.name); setCustomerPhone(c.phone)
    }
  }

  const addItem = (itemId: string) => {
    const it = inventory.find((i) => i.id === itemId)
    if (!it) return
    if (items.some((si) => si.itemId === itemId)) {
      toast.error('Item already added')
      return
    }
    if (it.stock <= 0) {
      toast.error('Out of stock')
      return
    }
    // metal value = netWeight × per-gram rate (use sellingPrice - making - stone approximation)
    // For demo: derive from item.sellingPrice - stoneValue - makingAmount
    const makingAmount =
      it.makingChargeType === 'PERCENT' ? (it.sellingPrice - it.stoneValue) * (it.makingChargeValue / 100) :
      it.makingChargeType === 'PER_GRAM' ? it.makingChargeValue * it.netWeight :
      it.makingChargeValue
    const metalValue = Math.max(0, it.sellingPrice - it.stoneValue - makingAmount)
    const si: SaleItem = {
      itemId: it.id,
      name: it.name,
      sku: it.sku,
      metal: it.metal,
      karat: it.karat,
      grossWeight: it.grossWeight,
      netWeight: it.netWeight,
      makingAmount,
      stoneValue: it.stoneValue,
      metalValue,
      subtotal: it.sellingPrice,
      quantity: 1,
    }
    setItems((arr) => [...arr, si])
  }

  const removeItem = (idx: number) => setItems((arr) => arr.filter((_, i) => i !== idx))
  const updateQty = (idx: number, qty: number) => {
    setItems((arr) => arr.map((si, i) => i === idx ? { ...si, quantity: Math.max(1, qty), subtotal: si.sellingPrice * Math.max(1, qty) } : si))
  }

  const totals = React.useMemo(() => {
    const totalMetal = items.reduce((s, it) => s + it.metalValue * it.quantity, 0)
    const totalMaking = items.reduce((s, it) => s + it.makingAmount * it.quantity, 0)
    const totalStone = items.reduce((s, it) => s + it.stoneValue * it.quantity, 0)
    const subTotal = items.reduce((s, it) => s + it.subtotal * it.quantity, 0)
    const gstAmount = (subTotal * gstRate) / 100
    const grandTotal = Math.max(0, subTotal + gstAmount - oldGoldAdj - discount)
    return { totalMetal, totalMaking, totalStone, subTotal, gstAmount, grandTotal }
  }, [items, gstRate, oldGoldAdj, discount])

  const valid = items.length > 0 && customerName.trim().length > 0

  const submit = () => {
    if (!valid) return
    onSave({
      customerId: customerId || 'walk-in',
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      items,
      totalMetalValue: totals.totalMetal,
      totalMaking: totals.totalMaking,
      totalStone: totals.totalStone,
      subTotal: totals.subTotal,
      gstRate,
      gstAmount: totals.gstAmount,
      oldGoldAdjustment: oldGoldAdj,
      discount,
      grandTotal: totals.grandTotal,
      paymentMode,
      paymentRef,
      status,
      amountPaid: status === 'PAID' ? totals.grandTotal : amountPaid,
      branch: settings.branch,
      billedBy: settings.ownerName,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Bill</DialogTitle>
          <DialogDescription>Create a new invoice — items, GST and old-gold adjustment</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Customer */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Customer</Label>
            {customers.length > 0 && (
              <Select value={customerId} onValueChange={selectCustomer}>
                <SelectTrigger><SelectValue placeholder="Select existing customer (or type below)" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} · {c.phone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input placeholder="Customer name *" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <Input placeholder="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Items</Label>
            {inventory.length > 0 && (
              <Select value="" onValueChange={addItem}>
                <SelectTrigger><SelectValue placeholder="+ Add item from inventory" /></SelectTrigger>
                <SelectContent>
                  {inventory.filter((i) => i.stock > 0 && !items.some((si) => si.itemId === i.id)).map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} · {i.sku} · {formatCurrency(i.sellingPrice, settings.currency)} ({i.stock} in stock)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center bg-muted/30 rounded-md">No items added yet</p>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{it.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {it.sku} · {it.karat} · {it.netWeight.toFixed(2)}g
                      </p>
                    </div>
                    <Input
                      type="number"
                      min="1"
                      value={it.quantity}
                      onChange={(e) => updateQty(idx, parseInt(e.target.value) || 1)}
                      className="w-14 h-8 text-center"
                    />
                    <p className="text-sm font-semibold tabular-nums w-24 text-right">
                      {formatCurrency(it.subtotal * it.quantity, settings.currency)}
                    </p>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={() => removeItem(idx)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div>
                <Label className="text-xs">GST Rate (%)</Label>
                <Input type="number" step="0.1" value={gstRate} onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label className="text-xs">Old Gold Adjustment (₹)</Label>
                <Input type="number" value={oldGoldAdj} onChange={(e) => setOldGoldAdj(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label className="text-xs">Discount (₹)</Label>
                <Input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Payment Mode</Label>
                <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as Sale['status'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="CREDIT">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {status !== 'PAID' && (
                <div>
                  <Label className="text-xs">Amount Paid (₹)</Label>
                  <Input type="number" value={amountPaid} onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)} />
                </div>
              )}
              {paymentMode !== 'CASH' && (
                <div>
                  <Label className="text-xs">Payment Reference</Label>
                  <Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="UPI / Card / Cheque ref" />
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm">
            <Row label="Sub Total" value={formatCurrency(totals.subTotal, settings.currency)} />
            <Row label={`GST (${gstRate}%)`} value={formatCurrency(totals.gstAmount, settings.currency)} />
            {oldGoldAdj > 0 && <Row label="Old Gold Adj" value={`- ${formatCurrency(oldGoldAdj, settings.currency)}`} />}
            {discount > 0 && <Row label="Discount" value={`- ${formatCurrency(discount, settings.currency)}`} />}
            <div className="border-t border-border my-1" />
            <div className="flex items-center justify-between">
              <span className="font-semibold">Grand Total</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(totals.grandTotal, settings.currency)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!valid}>Create Bill</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  )
}

function ViewBillDialog({
  sale,
  onClose,
  settings,
}: {
  sale: Sale | null
  onClose: () => void
  settings: ReturnType<typeof useJewelleryStore.getState>['settings']
}) {
  return (
    <Dialog open={!!sale} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {sale && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <ReceiptIndianRupee className="h-5 w-5 text-primary" />
                  {sale.invoiceNo}
                </span>
                <StatusBadge status={sale.status} />
              </DialogTitle>
              <DialogDescription>
                {formatDateTime(sale.createdAt)} · Billed by {sale.billedBy}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Customer */}
              <div className="bg-muted/40 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold">{sale.customerName}</p>
                    <p className="text-[11px] text-muted-foreground">{sale.customerPhone}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="border border-border rounded-lg overflow-hidden">
                {sale.items.map((it, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2.5 border-b border-border last:border-0">
                    <Gem className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{it.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {it.sku} · {it.karat} · {it.netWeight.toFixed(2)}g net
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Metal {formatCurrency(it.metalValue, settings.currency)} + Making {formatCurrency(it.makingAmount, settings.currency)}
                        {it.stoneValue > 0 && ` + Stone ${formatCurrency(it.stoneValue, settings.currency)}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-muted-foreground">x{it.quantity}</p>
                      <p className="text-sm font-semibold tabular-nums">{formatCurrency(it.subtotal * it.quantity, settings.currency)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-sm">
                <Row label="Sub Total" value={formatCurrency(sale.subTotal, settings.currency)} />
                <Row label={`GST (${sale.gstRate}%)`} value={formatCurrency(sale.gstAmount, settings.currency)} />
                {sale.oldGoldAdjustment > 0 && <Row label="Old Gold Adj" value={`- ${formatCurrency(sale.oldGoldAdjustment, settings.currency)}`} />}
                {sale.discount > 0 && <Row label="Discount" value={`- ${formatCurrency(sale.discount, settings.currency)}`} />}
                <div className="border-t border-border my-1" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Grand Total</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(sale.grandTotal, settings.currency)}</span>
                </div>
                {sale.amountPaid < sale.grandTotal && (
                  <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                    <span>Amount Paid</span>
                    <span className="font-medium">{formatCurrency(sale.amountPaid, settings.currency)}</span>
                  </div>
                )}
                <Row label="Payment Mode" value={sale.paymentMode + (sale.paymentRef ? ` · ${sale.paymentRef}` : '')} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-1.5" />
                Print
              </Button>
              <Button onClick={onClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
