'use client'

import * as React from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  LineChart, Line, Legend,
} from 'recharts'
import {
  BarChart3, TrendingUp, ReceiptIndianRupee, Package, Gem, Download,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useJewelleryStore, formatCurrency, formatCompact } from '@/lib/store'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'

export function ReportsView() {
  const { sales, inventory, exchanges, settings } = useJewelleryStore()

  // Sales by month (last 6 months)
  const monthlyData = React.useMemo(() => {
    const now = new Date()
    const months: { label: string; total: number; bills: number; gst: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      const ms = sales.filter((s) => {
        const sd = new Date(s.createdAt)
        return sd >= d && sd < end
      })
      months.push({
        label: d.toLocaleDateString('en-IN', { month: 'short' }),
        total: ms.reduce((sum, s) => sum + s.grandTotal, 0),
        bills: ms.length,
        gst: ms.reduce((sum, s) => sum + s.gstAmount, 0),
      })
    }
    return months
  }, [sales])

  // Sales by category (last 30 days)
  const categoryData = React.useMemo(() => {
    const cutoff = new Date(Date.now() - 30 * 86400000)
    const map = new Map<string, number>()
    sales.filter((s) => new Date(s.createdAt) >= cutoff).forEach((s) => {
      s.items.forEach((it) => {
        const cat = it.metal
        map.set(cat, (map.get(cat) ?? 0) + it.subtotal * it.quantity)
      })
    })
    const colors: Record<string, string> = {
      GOLD: 'var(--chart-1)', SILVER: 'var(--chart-2)', DIAMOND: 'var(--chart-3)',
      PLATINUM: 'var(--chart-4)', OTHER: 'var(--chart-5)',
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value, color: colors[name] ?? 'var(--chart-5)' }))
      .sort((a, b) => b.value - a.value)
  }, [sales])

  // Stock by category
  const stockByCat = React.useMemo(() => {
    const map = new Map<string, { count: number; value: number }>()
    inventory.forEach((it) => {
      const prev = map.get(it.category) ?? { count: 0, value: 0 }
      prev.count += it.stock
      prev.value += it.costPrice * it.stock
      map.set(it.category, prev)
    })
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.value - a.value)
  }, [inventory])

  // GST summary
  const gstData = React.useMemo(() => {
    const cutoff = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const ms = sales.filter((s) => new Date(s.createdAt) >= cutoff && s.status !== 'CANCELLED')
    const taxable = ms.reduce((s, x) => s + x.subTotal, 0)
    const cgst = ms.reduce((s, x) => s + x.gstAmount / 2, 0)
    const sgst = cgst
    const igst = 0 // intra-state assumed
    const totalTax = ms.reduce((s, x) => s + x.gstAmount, 0)
    const grandTotal = ms.reduce((s, x) => s + x.grandTotal, 0)
    return { taxable, cgst, sgst, igst, totalTax, grandTotal, billCount: ms.length }
  }, [sales])

  // Top selling items (30d)
  const topItems = React.useMemo(() => {
    const cutoff = new Date(Date.now() - 30 * 86400000)
    const map = new Map<string, { name: string; qty: number; total: number }>()
    sales.filter((s) => new Date(s.createdAt) >= cutoff).forEach((s) => {
      s.items.forEach((it) => {
        const prev = map.get(it.itemId) ?? { name: it.name, qty: 0, total: 0 }
        prev.qty += it.quantity
        prev.total += it.subtotal * it.quantity
        map.set(it.itemId, prev)
      })
    })
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 6)
  }, [sales])

  // Exchange value over last 6 months
  const exchangeMonthly = React.useMemo(() => {
    const now = new Date()
    const months: { label: string; value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      const v = exchanges
        .filter((e) => { const ed = new Date(e.createdAt); return ed >= d && ed < end })
        .reduce((s, e) => s + e.totalValue, 0)
      months.push({ label: d.toLocaleDateString('en-IN', { month: 'short' }), value: v })
    }
    return months
  }, [exchanges])

  const handleExportCSV = () => {
    const rows = [
      ['Invoice No', 'Date', 'Customer', 'Phone', 'Sub Total', 'GST', 'Old Gold Adj', 'Discount', 'Grand Total', 'Status', 'Payment'],
      ...sales.map((s) => [
        s.invoiceNo,
        new Date(s.createdAt).toLocaleDateString('en-IN'),
        s.customerName,
        s.customerPhone,
        s.subTotal,
        s.gstAmount,
        s.oldGoldAdjustment,
        s.discount,
        s.grandTotal,
        s.status,
        s.paymentMode,
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ss-jewellery-sales-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Reports & Analytics
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sales, stock and GST insights
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} className="shrink-0">
          <Download className="h-4 w-4 mr-1.5" />
          Export CSV
        </Button>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="gst">GST</TabsTrigger>
        </TabsList>

        {/* === Sales tab === */}
        <TabsContent value="sales" className="space-y-4 mt-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card><CardContent className="p-3">
              <p className="text-[11px] text-muted-foreground">Total Sales (6mo)</p>
              <p className="text-base md:text-lg font-bold mt-0.5">{formatCompact(monthlyData.reduce((s, m) => s + m.total, 0), settings.currency)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3">
              <p className="text-[11px] text-muted-foreground">Total Bills (6mo)</p>
              <p className="text-base md:text-lg font-bold mt-0.5">{monthlyData.reduce((s, m) => s + m.bills, 0)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3">
              <p className="text-[11px] text-muted-foreground">Avg Bill Value</p>
              <p className="text-base md:text-lg font-bold mt-0.5">{formatCompact(
                monthlyData.reduce((s, m) => s + m.total, 0) / Math.max(1, monthlyData.reduce((s, m) => s + m.bills, 0)),
                settings.currency,
              )}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3">
              <p className="text-[11px] text-muted-foreground">Best Month</p>
              <p className="text-base md:text-lg font-bold mt-0.5">
                {monthlyData.reduce((max, m) => m.total > max.total ? m : max, monthlyData[0])?.label ?? '-'}
              </p>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Monthly Sales (6 Months)
              </CardTitle>
              <CardDescription className="text-xs">Revenue trend across months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => formatCompact(v, '')} />
                    <Tooltip
                      contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--popover-foreground)' }}
                      formatter={(v: number, n) => [formatCurrency(v, settings.currency), n === 'total' ? 'Revenue' : n]}
                    />
                    <Bar dataKey="total" name="Revenue" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Sales by Metal (30d)</CardTitle>
                <CardDescription className="text-xs">Revenue distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => formatCompact(v, '')} />
                      <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} width={70} />
                      <Tooltip
                        contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--popover-foreground)' }}
                        formatter={(v: number) => [formatCurrency(v, settings.currency), 'Revenue']}
                      />
                      <Bar dataKey="value" name="Revenue" radius={[0, 6, 6, 0]}>
                        {categoryData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top Items (30d)</CardTitle>
                <CardDescription className="text-xs">Best sellers by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {topItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No sales in last 30 days</p>
                ) : (
                  <div className="space-y-2">
                    {topItems.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{it.name}</p>
                          <p className="text-[11px] text-muted-foreground">{it.qty} units sold</p>
                        </div>
                        <span className="text-sm font-semibold shrink-0">{formatCurrency(it.total, settings.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Gem className="h-4 w-4" /> Old Gold Buy / Exchange
              </CardTitle>
              <CardDescription className="text-xs">Monthly value (last 6 months)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={exchangeMonthly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => formatCompact(v, '')} />
                    <Tooltip
                      contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--popover-foreground)' }}
                      formatter={(v: number) => [formatCurrency(v, settings.currency), 'Value']}
                    />
                    <Line type="monotone" dataKey="value" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 4, fill: 'var(--chart-2)' }} name="Value" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === Stock tab === */}
        <TabsContent value="stock" className="space-y-4 mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" /> Stock Value by Category
              </CardTitle>
              <CardDescription className="text-xs">Cost value distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockByCat} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} interval={0} angle={-15} textAnchor="end" height={50} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => formatCompact(v, '')} />
                    <Tooltip
                      contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--popover-foreground)' }}
                      formatter={(v: number, n) => [n === 'value' ? formatCurrency(v, settings.currency) : v, n === 'value' ? 'Stock Value' : 'Units']}
                    />
                    <Bar dataKey="value" name="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Detailed Stock Breakdown</CardTitle>
              <CardDescription className="text-xs">Per category with units & value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium px-3 py-2">Category</th>
                      <th className="text-right font-medium px-3 py-2">Units</th>
                      <th className="text-right font-medium px-3 py-2">Cost Value</th>
                      <th className="text-right font-medium px-3 py-2">Avg / Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockByCat.map((row) => (
                      <tr key={row.name} className="border-b border-border last:border-0">
                        <td className="px-3 py-2"><Badge variant="outline" className="text-xs">{row.name}</Badge></td>
                        <td className="px-3 py-2 text-right tabular-nums">{row.count}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">{formatCurrency(row.value, settings.currency)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{formatCurrency(row.count ? row.value / row.count : 0, settings.currency)}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/30 font-semibold">
                      <td className="px-3 py-2">Total</td>
                      <td className="px-3 py-2 text-right tabular-nums">{stockByCat.reduce((s, r) => s + r.count, 0)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(stockByCat.reduce((s, r) => s + r.value, 0), settings.currency)}</td>
                      <td className="px-3 py-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === GST tab === */}
        <TabsContent value="gst" className="space-y-4 mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ReceiptIndianRupee className="h-4 w-4" /> GST Summary
              </CardTitle>
              <CardDescription className="text-xs">
                For {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} · {gstData.billCount} bills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <GstRow label="Taxable Value" value={formatCurrency(gstData.taxable, settings.currency)} />
                <GstRow label="CGST" value={formatCurrency(gstData.cgst, settings.currency)} />
                <GstRow label="SGST" value={formatCurrency(gstData.sgst, settings.currency)} />
                <GstRow label="IGST" value={formatCurrency(gstData.igst, settings.currency)} />
                <GstRow label="Total Tax" value={formatCurrency(gstData.totalTax, settings.currency)} highlight />
                <GstRow label="Grand Total" value={formatCurrency(gstData.grandTotal, settings.currency)} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                * CGST/SGST split assumes intra-state transactions. Adjust IGST for inter-state sales.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Bills (GST View)</CardTitle>
              <CardDescription className="text-xs">Latest 10 bills with tax breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium px-2 py-2">Invoice</th>
                      <th className="text-left font-medium px-2 py-2">Customer</th>
                      <th className="text-right font-medium px-2 py-2">Taxable</th>
                      <th className="text-right font-medium px-2 py-2">GST</th>
                      <th className="text-right font-medium px-2 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.slice(0, 10).map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-0">
                        <td className="px-2 py-2 font-medium">{s.invoiceNo}</td>
                        <td className="px-2 py-2 truncate max-w-[150px]">{s.customerName}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{formatCurrency(s.subTotal, settings.currency)}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{formatCurrency(s.gstAmount, settings.currency)}</td>
                        <td className="px-2 py-2 text-right tabular-nums font-semibold">{formatCurrency(s.grandTotal, settings.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GstRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-primary/10' : 'bg-muted/40'}`}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-base font-bold mt-0.5 ${highlight ? 'text-primary' : ''}`}>{value}</p>
    </div>
  )
}
