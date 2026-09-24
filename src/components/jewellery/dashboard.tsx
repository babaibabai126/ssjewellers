'use client'

import * as React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Package,
  ReceiptIndianRupee,
  Users,
  Hammer,
  AlertTriangle,
  ArrowRight,
  Gem,
  Sparkles,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useJewelleryStore, formatCurrency, formatCompact, formatDate, relativeTime } from '@/lib/store'
import type { ViewKey } from '@/app/page'

interface DashboardProps {
  onNavigate: (v: ViewKey) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { sales, inventory, customers, karigars, workOrders, exchanges, settings } = useJewelleryStore()

  // === KPIs ===
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const last7dStart = new Date(todayStart.getTime() - 6 * 86400000)
  const last30dStart = new Date(todayStart.getTime() - 29 * 86400000)

  const salesToday = sales.filter((s) => new Date(s.createdAt) >= todayStart)
  const sales7d = sales.filter((s) => new Date(s.createdAt) >= last7dStart)
  const sales30d = sales.filter((s) => new Date(s.createdAt) >= last30dStart)

  const totalToday = salesToday.reduce((sum, s) => sum + s.grandTotal, 0)
  const total7d = sales7d.reduce((sum, s) => sum + s.grandTotal, 0)
  const total30d = sales30d.reduce((sum, s) => sum + s.grandTotal, 0)
  const prev30dStart = new Date(last30dStart.getTime() - 30 * 86400000)
  const prev30dEnd = last30dStart
  const salesPrev30d = sales.filter((s) => {
    const d = new Date(s.createdAt)
    return d >= prev30dStart && d < prev30dEnd
  })
  const prev30dTotal = salesPrev30d.reduce((sum, s) => sum + s.grandTotal, 0)
  const trendPct = prev30dTotal === 0 ? 100 : ((total30d - prev30dTotal) / prev30dTotal) * 100
  const isTrendUp = trendPct >= 0

  // stock value (cost)
  const stockValue = inventory.reduce((sum, it) => sum + it.costPrice * it.stock, 0)
  const lowStock = inventory.filter((it) => it.stock <= 2)
  const totalStockUnits = inventory.reduce((sum, it) => sum + it.stock, 0)

  // karigar stats
  const activeWorkOrders = workOrders.filter((wo) => wo.status === 'PENDING' || wo.status === 'IN_PROGRESS')
  const overdueWos = workOrders.filter((wo) => new Date(wo.dueDate) < new Date() && wo.status !== 'DELIVERED' && wo.status !== 'CANCELLED')
  const outstandingPay = karigars.reduce((sum, k) => sum + k.outstandingPayment, 0)

  // exchange value (last 30d)
  const exchange30dValue = exchanges
    .filter((e) => new Date(e.createdAt) >= last30dStart)
    .reduce((sum, e) => sum + e.totalValue, 0)

  // === Sales chart (last 14 days) ===
  const chartData = React.useMemo(() => {
    const days: { date: string; label: string; total: number; bills: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(todayStart.getTime() - i * 86400000)
      const next = new Date(d.getTime() + 86400000)
      const dayTotal = sales
        .filter((s) => {
          const sd = new Date(s.createdAt)
          return sd >= d && sd < next
        })
        .reduce((sum, s) => sum + s.grandTotal, 0)
      const dayBills = sales.filter((s) => {
        const sd = new Date(s.createdAt)
        return sd >= d && sd < next
      }).length
      days.push({
        date: d.toISOString(),
        label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        total: dayTotal,
        bills: dayBills,
      })
    }
    return days
  }, [sales, todayStart])

  // === Top items (by sales amount in last 30d) ===
  const topItems = React.useMemo(() => {
    const map = new Map<string, { name: string; qty: number; total: number; category: string }>()
    sales30d.forEach((s) =>
      s.items.forEach((it) => {
        const prev = map.get(it.itemId) ?? { name: it.name, qty: 0, total: 0, category: it.metal }
        prev.qty += it.quantity
        prev.total += it.subtotal
        map.set(it.itemId, prev)
      }),
    )
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [sales30d])

  // === Metal mix (stock value by metal) ===
  const metalMix = React.useMemo(() => {
    const map = new Map<string, number>()
    inventory.forEach((it) => {
      map.set(it.metal, (map.get(it.metal) ?? 0) + it.costPrice * it.stock)
    })
    const colors: Record<string, string> = {
      GOLD: 'var(--chart-1)',
      SILVER: 'var(--chart-2)',
      DIAMOND: 'var(--chart-3)',
      PLATINUM: 'var(--chart-4)',
      OTHER: 'var(--chart-5)',
    }
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
      color: colors[name] ?? 'var(--chart-5)',
    }))
  }, [inventory])

  // === Recent activity (last 5 sales) ===
  const recentSales = sales.slice(0, 5)

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-xl bg-gold-gradient text-white p-4 md:p-6">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs opacity-90 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Welcome back, {settings.ownerName.split(' ')[0]}
            </p>
            <h1 className="text-xl md:text-2xl font-bold mt-1">{settings.shopName} Dashboard</h1>
            <p className="text-sm opacity-90 mt-1">
              {salesToday.length} bills today · {formatCurrency(totalToday, settings.currency)} revenue
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="bg-white/15 backdrop-blur rounded-lg px-3 py-2">
              <p className="text-[10px] opacity-80 uppercase tracking-wide">Today&apos;s Gold Rate · 24K</p>
              <p className="text-lg md:text-xl font-bold">
                {formatCurrency(settings.defaultGoldRate24K, settings.currency)}
                <span className="text-xs opacity-80 font-normal ml-1">/ gram</span>
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white text-amber-900 hover:bg-white/90"
              onClick={() => onNavigate('sales')}
            >
              <ReceiptIndianRupee className="h-4 w-4 mr-1" />
              New Bill
            </Button>
          </div>
        </div>
        <Gem className="absolute -right-6 -bottom-6 h-32 w-32 opacity-10" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard
          title="Today's Sales"
          value={formatCompact(totalToday, settings.currency)}
          subtitle={`${salesToday.length} bills`}
          icon={ReceiptIndianRupee}
          tone="primary"
          onClick={() => onNavigate('sales')}
        />
        <KpiCard
          title="30-Day Revenue"
          value={formatCompact(total30d, settings.currency)}
          subtitle={
            <span className={`inline-flex items-center gap-1 ${isTrendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isTrendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trendPct).toFixed(1)}% vs prev
            </span>
          }
          icon={TrendingUp}
          tone="success"
        />
        <KpiCard
          title="Stock Value"
          value={formatCompact(stockValue, settings.currency)}
          subtitle={`${totalStockUnits} units · ${inventory.length} SKUs`}
          icon={Package}
          tone="info"
          onClick={() => onNavigate('inventory')}
        />
        <KpiCard
          title="Customers"
          value={String(customers.length)}
          subtitle={`${karigars.length} active karigars`}
          icon={Users}
          tone="warning"
          onClick={() => onNavigate('customers')}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Sales — Last 14 Days</CardTitle>
                <CardDescription className="text-xs">Daily revenue trend</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-normal">
                {formatCompact(total7d, settings.currency)} · 7d
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] md:h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    interval={1}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    tickFormatter={(v) => formatCompact(v, '')}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--popover-foreground)',
                    }}
                    formatter={(v: number) => [formatCurrency(v, settings.currency), 'Revenue']}
                    labelStyle={{ color: 'var(--popover-foreground)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#salesGrad)"
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Metal mix */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stock by Metal</CardTitle>
            <CardDescription className="text-xs">Value distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metalMix}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={75}
                    paddingAngle={2}
                    stroke="var(--background)"
                    strokeWidth={2}
                  >
                    {metalMix.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--popover-foreground)',
                    }}
                    formatter={(v: number, n) => [formatCurrency(v, settings.currency), n]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-3">
              {metalMix.map((m) => (
                <div key={m.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                    <span className="font-medium">{m.name}</span>
                  </div>
                  <span className="text-muted-foreground">{formatCompact(m.value, settings.currency)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top items + Recent sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Top Items (30d)</CardTitle>
                <CardDescription className="text-xs">Best selling products</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onNavigate('inventory')}>
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No sales in last 30 days</p>
            ) : (
              <div className="space-y-3">
                {topItems.map((it, idx) => {
                  const maxTotal = topItems[0].total
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                          <span className="font-medium truncate">{it.name}</span>
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5">{it.category}</Badge>
                        </div>
                        <span className="font-semibold shrink-0 ml-2">{formatCompact(it.total, settings.currency)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={(it.total / maxTotal) * 100} className="h-1.5" />
                        <span className="text-[10px] text-muted-foreground w-10 text-right">{it.qty} qty</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Bills</CardTitle>
                <CardDescription className="text-xs">Latest sales activity</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onNavigate('sales')}>
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No sales yet</p>
            ) : (
              <div className="space-y-2.5">
                {recentSales.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{s.customerName}</p>
                        <StatusBadge status={s.status} />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {s.invoiceNo} · {relativeTime(s.createdAt)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{formatCurrency(s.grandTotal, settings.currency)}</p>
                      <p className="text-[11px] text-muted-foreground">{s.items.length} items</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Operational alerts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Low stock */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Low Stock
              </CardTitle>
              <Badge variant="secondary" className="text-xs">{lowStock.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {lowStock.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3">All items well stocked</p>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto scroll-slim">
                {lowStock.slice(0, 5).map((it) => (
                  <div key={it.id} className="flex items-center justify-between text-xs">
                    <span className="truncate">{it.name}</span>
                    <Badge variant="destructive" className="text-[10px] py-0 px-1.5">{it.stock} left</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Work orders */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Hammer className="h-4 w-4 text-primary" />
                Active Work Orders
              </CardTitle>
              <Badge variant="secondary" className="text-xs">{activeWorkOrders.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {activeWorkOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3">No active orders</p>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto scroll-slim">
                {activeWorkOrders.slice(0, 5).map((wo) => (
                  <div key={wo.id} className="flex items-center justify-between text-xs">
                    <span className="truncate">{wo.karigarName} · {wo.category}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDate(wo.dueDate)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {overdueWos.length > 0 && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-2">
                {overdueWos.length} overdue · {formatCompact(outstandingPay, settings.currency)} payable
              </p>
            )}
          </CardContent>
        </Card>

        {/* Old gold exchange */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Gem className="h-4 w-4 text-primary" />
                Old Gold (30d)
              </CardTitle>
              <Badge variant="secondary" className="text-xs">{formatCompact(exchange30dValue, settings.currency)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              Bought {exchanges.filter((e) => new Date(e.createdAt) >= last30dStart).length} vouchers worth {formatCurrency(exchange30dValue, settings.currency)} from customers in the last 30 days. Use the Exchange tab to record new buy-backs.
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full text-xs h-8" onClick={() => onNavigate('exchange')}>
              <Gem className="h-3.5 w-3.5 mr-1" />
              Record Exchange
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
  onClick,
}: {
  title: string
  value: string
  subtitle?: React.ReactNode
  icon: React.ElementType
  tone: 'primary' | 'success' | 'info' | 'warning'
  onClick?: () => void
}) {
  const toneClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    info: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  }[tone]

  return (
    <Card
      className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
      onClick={onClick}
    >
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">{title}</p>
            <p className="text-lg md:text-2xl font-bold mt-1 truncate">{value}</p>
            <div className="text-[11px] mt-1">{subtitle}</div>
          </div>
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${toneClasses}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const variant =
    status === 'PAID' ? 'default' :
    status === 'PARTIAL' ? 'secondary' :
    status === 'CREDIT' ? 'destructive' :
    status === 'CANCELLED' ? 'outline' :
    'secondary'
  const cls =
    status === 'PAID' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' :
    status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30' :
    status === 'CREDIT' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30' :
    status === 'CANCELLED' ? 'bg-muted text-muted-foreground' :
    ''
  return (
    <Badge variant={variant} className={`text-[10px] py-0 px-1.5 ${cls}`}>
      {status}
    </Badge>
  )
}
