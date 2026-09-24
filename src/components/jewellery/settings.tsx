'use client'

import * as React from 'react'
import {
  Settings as SettingsIcon, Store, ReceiptIndianRupee, Gem, Sun, Moon, Monitor, RotateCcw, Save,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTheme } from 'next-themes'
import { useJewelleryStore } from '@/lib/store'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

export function SettingsView() {
  const { settings, updateSettings, resetAll } = useJewelleryStore()
  const { theme, setTheme } = useTheme()
  const [form, setForm] = React.useState(settings)
  const [resetOpen, setResetOpen] = React.useState(false)

  React.useEffect(() => setForm(settings), [settings])

  const update = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  const save = () => {
    updateSettings(form)
    toast.success('Settings saved')
  }

  const handleReset = () => {
    resetAll()
    toast.success('Demo data restored')
    setResetOpen(false)
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, desc: 'Bright cream theme' },
    { value: 'dark', label: 'Dark', icon: Moon, desc: 'Deep charcoal theme' },
    { value: 'system', label: 'System', icon: Monitor, desc: 'Match device setting' },
  ] as const

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-primary" />
          Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Configure shop, rates, theme and data</p>
      </div>

      {/* Theme */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sun className="h-4 w-4" /> Appearance
          </CardTitle>
          <CardDescription className="text-xs">Choose your preferred theme — works on mobile & desktop</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((opt) => {
              const Icon = opt.icon
              const isActive = theme === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 p-3 transition-all ${
                    isActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground text-center">{opt.desc}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Shop info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="h-4 w-4" /> Shop Information
          </CardTitle>
          <CardDescription className="text-xs">Shown on invoices and reports</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Shop Name</Label>
            <Input value={form.shopName} onChange={(e) => update({ shopName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Owner Name</Label>
            <Input value={form.ownerName} onChange={(e) => update({ ownerName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => update({ phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => update({ address: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => update({ city: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Pincode</Label>
            <Input value={form.pincode} onChange={(e) => update({ pincode: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      {/* Tax & rates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ReceiptIndianRupee className="h-4 w-4" /> Tax & Rates
          </CardTitle>
          <CardDescription className="text-xs">Default GST and metal rates</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>GST Rate (%)</Label>
            <Input type="number" step="0.1" value={form.defaultGstRate} onChange={(e) => update({ defaultGstRate: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label>Currency Symbol</Label>
            <Input value={form.currency} onChange={(e) => update({ currency: e.target.value })} maxLength={2} />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1"><Gem className="h-3 w-3" /> Gold Rate 24K (₹/g)</Label>
            <Input type="number" value={form.defaultGoldRate24K} onChange={(e) => update({ defaultGoldRate24K: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label>Silver Rate (₹/kg)</Label>
            <Input type="number" value={form.defaultSilverRate} onChange={(e) => update({ defaultSilverRate: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label>Branch Name</Label>
            <Input value={form.branch} onChange={(e) => update({ branch: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>GSTIN</Label>
            <Input value={form.gstin} onChange={(e) => update({ gstin: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>PAN</Label>
            <Input value={form.pan} onChange={(e) => update({ pan: e.target.value })} />
          </div>
        </CardContent>
        <CardFooter className="justify-end pt-3">
          <Button onClick={save}>
            <Save className="h-4 w-4 mr-1.5" />
            Save Changes
          </Button>
        </CardFooter>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="h-4 w-4" /> Data Management
          </CardTitle>
          <CardDescription className="text-xs">
            All data is stored locally in your browser (localStorage). No server required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div>
              <p className="text-sm font-medium">Reset to Demo Data</p>
              <p className="text-[11px] text-muted-foreground">Restore all sample inventory, bills, customers etc.</p>
            </div>
            <Button variant="outline" onClick={() => setResetOpen(true)}>
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground text-center pb-4">
        SS Jewellery ERP · Built with Next.js 16 + shadcn/ui · Light & Dark mode · Mobile friendly
      </p>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will erase all current data and restore the demo seed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
