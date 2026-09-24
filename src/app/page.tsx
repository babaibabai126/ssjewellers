'use client'

import * as React from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import {
  LayoutDashboard,
  Package,
  ReceiptIndianRupee,
  Users,
  Hammer,
  Repeat,
  BarChart3,
  Settings,
  Gem,
  Menu,
  Search,
  Bell,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useJewelleryStore } from '@/lib/store'
import { Dashboard } from '@/components/jewellery/dashboard'
import { InventoryView } from '@/components/jewellery/inventory'
import { SalesView } from '@/components/jewellery/sales'
import { CustomersView } from '@/components/jewellery/customers'
import { KarigarView } from '@/components/jewellery/karigar'
import { ExchangeView } from '@/components/jewellery/exchange'
import { ReportsView } from '@/components/jewellery/reports'
import { SettingsView } from '@/components/jewellery/settings'

export type ViewKey =
  | 'dashboard'
  | 'inventory'
  | 'sales'
  | 'customers'
  | 'karigar'
  | 'exchange'
  | 'reports'
  | 'settings'

interface NavItem {
  key: ViewKey
  label: string
  icon: React.ElementType
  description: string
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & KPIs' },
  { key: 'inventory', label: 'Inventory', icon: Package, description: 'Stock & items' },
  { key: 'sales', label: 'Sales', icon: ReceiptIndianRupee, description: 'Bills & invoicing' },
  { key: 'customers', label: 'Customers', icon: Users, description: 'Customer list' },
  { key: 'karigar', label: 'Karigar', icon: Hammer, description: 'Artisans & work orders' },
  { key: 'exchange', label: 'Exchange', icon: Repeat, description: 'Old gold buy' },
  { key: 'reports', label: 'Reports', icon: BarChart3, description: 'Analytics & GST' },
  { key: 'settings', label: 'Settings', icon: Settings, description: 'Shop setup' },
]

// Mobile bottom nav keeps the 5 most-used destinations
const MOBILE_PRIMARY: ViewKey[] = ['dashboard', 'inventory', 'sales', 'karigar', 'reports']

export default function Home() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="ss-jewellery-theme"
    >
      <AppShell />
    </ThemeProvider>
  )
}

function AppShell() {
  const [active, setActive] = React.useState<ViewKey>('dashboard')
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const hydrateSeed = useJewelleryStore((s) => s.hydrateSeed)
  const settings = useJewelleryStore((s) => s.settings)

  // Ensure seed data is hydrated on first mount (also handles the case where
  // localStorage was already populated by the persist middleware).
  React.useEffect(() => {
    hydrateSeed()
  }, [hydrateSeed])

  const activeItem = NAV_ITEMS.find((n) => n.key === active) ?? NAV_ITEMS[0]

  const renderView = () => {
    switch (active) {
      case 'dashboard': return <Dashboard onNavigate={setActive} />
      case 'inventory': return <InventoryView />
      case 'sales': return <SalesView />
      case 'customers': return <CustomersView />
      case 'karigar': return <KarigarView />
      case 'exchange': return <ExchangeView />
      case 'reports': return <ReportsView />
      case 'settings': return <SettingsView />
      default: return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* ===== Top header (sticky, both mobile & desktop) ===== */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
          {/* Mobile: hamburger to open full nav sheet */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="px-4 pt-4 pb-2">
                <SheetTitle className="text-left flex items-center gap-2">
                  <Gem className="h-5 w-5 text-primary" />
                  SS Jewellery
                </SheetTitle>
              </SheetHeader>
              <nav className="px-2 py-2 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  const isActive = active === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        setActive(item.key)
                        setMobileOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                      <span className={`text-xs ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {item.description}
                      </span>
                    </button>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Brand */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-gradient">
              <Gem className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight">{settings.shopName}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Jewellery ERP</p>
            </div>
          </div>

          {/* Search (desktop only — hidden on mobile to save space) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search inventory, bills, customers…"
                className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="flex-1 md:hidden" />

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile page title row */}
        <div className="md:hidden px-3 pb-2 -mt-1">
          <h1 className="text-base font-semibold">{activeItem.label}</h1>
          <p className="text-[11px] text-muted-foreground">{activeItem.description}</p>
        </div>
      </header>

      {/* ===== Body: sidebar (desktop) + content ===== */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar/50">
          <nav className="flex-1 p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = active === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => setActive(item.key)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>
          <div className="p-3 border-t border-border">
            <div className="rounded-lg bg-gold-gradient p-3 text-white">
              <p className="text-xs font-semibold">Gold Rate (24K)</p>
              <p className="text-lg font-bold leading-tight">
                ₹{settings.defaultGoldRate24K.toLocaleString('en-IN')}
                <span className="text-[10px] font-normal opacity-80 ml-1">/g</span>
              </p>
              <p className="text-[10px] opacity-80 mt-1">{settings.city} · Today</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-x-hidden pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
            {renderView()}
          </div>
        </main>
      </div>

      {/* ===== Mobile bottom navigation ===== */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md safe-area-inset">
        <div className="grid grid-cols-5">
          {MOBILE_PRIMARY.map((key) => {
            const item = NAV_ITEMS.find((n) => n.key === key)!
            const Icon = item.icon
            const isActive = active === key
            return (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
