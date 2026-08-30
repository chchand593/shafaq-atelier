"use client";

import * as React from "react";
import {
  Check,
  X,
  Settings,
  CreditCard,
  Store,
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  Loader2,
  Save,
  RotateCcw,
  AlertCircle,
  Building2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import { toast } from "sonner";

type SettingsData = {
  businessName: string;
  businessAddress: string;
  businessEmail: string;
  businessPhone: string;
  businessWhatsapp: string;
  shippingCharge: number;
  freeShippingThreshold: number;
  lowStockThreshold: number;
  storeOpen: boolean;
  announcement: string;
  // Manual transfer payment settings
  jazzCashNumber: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountTitle: string;
  manualTransferEnabled: boolean;
  codEnabled: boolean;
};

const DEFAULTS: SettingsData = {
  businessName: "ShafaQ Atelier",
  businessAddress: "M.A. Jinnah Road, Okara, Punjab, Pakistan",
  businessEmail: "hello@shafaqatelier.pk",
  businessPhone: "+92 300 1234567",
  businessWhatsapp: "+92 300 1234567",
  shippingCharge: 350,
  freeShippingThreshold: 10000,
  lowStockThreshold: 5,
  storeOpen: true,
  announcement: "",
  jazzCashNumber: "03256912201",
  bankName: "Raqmi Islamic Digital Bank",
  bankAccountNumber: "028846199786",
  bankAccountTitle: "ShafaQ Atelier",
  manualTransferEnabled: true,
  codEnabled: true,
};

export function AdminSettings() {
  const [initial, setInitial] = React.useState<SettingsData>(DEFAULTS);
  const [form, setForm] = React.useState<SettingsData>(DEFAULTS);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const jazzcashGatewayConfigured = !!(process.env.NEXT_PUBLIC_PAYMENT_GATEWAY);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) throw new Error();
        const d = (await res.json()) as { settings: SettingsData };
        if (cancelled) return;
        setInitial(d.settings || DEFAULTS);
        setForm(d.settings || DEFAULTS);
      } catch {
        if (!cancelled) toast.error("Failed to load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = React.useMemo(
    () => JSON.stringify(initial) !== JSON.stringify(form),
    [initial, form]
  );

  // Sanity: at least one payment method must be enabled to allow saving.
  const noPaymentMethodEnabled = !form.codEnabled && !form.manualTransferEnabled;

  const setField = <K extends keyof SettingsData>(k: K, v: SettingsData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (noPaymentMethodEnabled) {
      toast.error("At least one payment method must be enabled.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          announcement: form.announcement.trim().length > 0 ? form.announcement.trim() : null,
        }),
      });
      const d = (await res.json()) as { ok?: boolean; error?: string; settings?: SettingsData };
      if (!res.ok || !d.ok) {
        throw new Error(d.error || "Failed to save settings");
      }
      setInitial(d.settings || form);
      setForm(d.settings || form);
      toast.success("Settings saved", {
        description: "Store configuration has been updated.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setForm(initial);
    toast("Changes discarded");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <span className="eyebrow text-[var(--gold)]">Configuration</span>
        <h1 className="font-serif text-2xl font-medium sm:text-3xl">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">
          Edit store information, shipping rules, payment methods, and availability.
          Automatic JazzCash gateway credentials remain in environment variables and are never editable here.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Business Information */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-serif text-lg font-medium">
            <Store className="size-5 text-[var(--gold)]" />
            Business Information
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FieldShell icon={Store} label="Business Name">
              <Input
                value={form.businessName}
                onChange={(e) => setField("businessName", e.target.value)}
                maxLength={200}
                placeholder="ShafaQ Atelier"
              />
            </FieldShell>
            <FieldShell icon={Mail} label="Email">
              <Input
                type="email"
                value={form.businessEmail}
                onChange={(e) => setField("businessEmail", e.target.value)}
                maxLength={200}
                placeholder="hello@shafaqatelier.pk"
              />
            </FieldShell>
            <FieldShell icon={Phone} label="Phone">
              <Input
                value={form.businessPhone}
                onChange={(e) => setField("businessPhone", e.target.value)}
                maxLength={200}
                placeholder="+92 300 1234567"
              />
            </FieldShell>
            <FieldShell icon={MessageCircle} label="WhatsApp">
              <Input
                value={form.businessWhatsapp}
                onChange={(e) => setField("businessWhatsapp", e.target.value)}
                maxLength={200}
                placeholder="+92 300 1234567"
              />
            </FieldShell>
            <div className="sm:col-span-2">
              <FieldShell icon={MapPin} label="Address">
                <Textarea
                  value={form.businessAddress}
                  onChange={(e) => setField("businessAddress", e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="M.A. Jinnah Road, Okara, Punjab, Pakistan"
                />
              </FieldShell>
            </div>
          </div>
        </div>

        {/* Store Settings */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-serif text-lg font-medium">
            <Settings className="size-5 text-[var(--gold)]" />
            Store Settings
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FieldShell label="Shipping Charge (PKR)">
              <Input
                type="number"
                value={form.shippingCharge}
                onChange={(e) => setField("shippingCharge", Math.max(0, Number(e.target.value) || 0))}
                min={0}
                max={100000}
              />
            </FieldShell>
            <FieldShell label="Free Shipping Threshold (PKR)">
              <Input
                type="number"
                value={form.freeShippingThreshold}
                onChange={(e) => setField("freeShippingThreshold", Math.max(0, Number(e.target.value) || 0))}
                min={0}
                max={1000000}
              />
            </FieldShell>
            <FieldShell label="Low Stock Threshold">
              <Input
                type="number"
                value={form.lowStockThreshold}
                onChange={(e) => setField("lowStockThreshold", Math.max(0, Number(e.target.value) || 0))}
                min={0}
                max={10000}
              />
            </FieldShell>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <p className="text-xs font-medium">Store Status</p>
                <p className="text-[0.65rem] text-muted-foreground">
                  {form.storeOpen ? "Accepting orders" : "Closed for orders"}
                </p>
              </div>
              <Switch
                checked={form.storeOpen}
                onCheckedChange={(v) => setField("storeOpen", v)}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldShell label="Store Announcement (optional)">
                <Textarea
                  value={form.announcement}
                  onChange={(e) => setField("announcement", e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="e.g. Free shipping this week on orders over PKR 10,000"
                />
              </FieldShell>
              <p className="mt-1 text-[0.65rem] text-muted-foreground">
                {form.announcement.length}/500 characters. Shown to customers across the storefront when set.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live summary */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Shipping Charge" value={formatPKR(form.shippingCharge)} />
        <SummaryCard
          label="Free Shipping At"
          value={formatPKR(form.freeShippingThreshold)}
        />
        <SummaryCard
          label="Low Stock Threshold"
          value={`${form.lowStockThreshold} units`}
        />
      </div>

      {/* Payment Methods */}
      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-serif text-lg font-medium">
          <CreditCard className="size-5 text-[var(--gold)]" />
          Payment Methods
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Enable or disable the payment methods shown to customers at checkout.
          At least one method must remain enabled.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {/* COD toggle */}
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="size-4 text-[var(--gold)]" />
                Cash on Delivery
              </p>
              <p className="text-xs text-muted-foreground">Customer pays in cash on delivery.</p>
            </div>
            <Switch
              checked={form.codEnabled}
              onCheckedChange={(v) => setField("codEnabled", v)}
            />
          </div>

          {/* Manual transfer toggle */}
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="size-4 text-[var(--gold)]" />
                JazzCash / Bank Transfer
              </p>
              <p className="text-xs text-muted-foreground">Manual verification — customer pays out-of-band, admin verifies.</p>
            </div>
            <Switch
              checked={form.manualTransferEnabled}
              onCheckedChange={(v) => setField("manualTransferEnabled", v)}
            />
          </div>
        </div>

        {/* Sanity warning */}
        {noPaymentMethodEnabled ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
            <AlertCircle className="size-4" />
            At least one payment method (COD or Manual Transfer) must be enabled.
          </div>
        ) : null}
      </div>

      {/* Manual Transfer Payment Instructions */}
      {form.manualTransferEnabled ? (
        <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-serif text-lg font-medium">
            <Building2 className="size-5 text-[var(--gold)]" />
            Manual Transfer Payment Instructions
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            These details are shown to customers during checkout so they know where to send the payment.
            Keep them accurate and up to date. These are PUBLIC — they are not secret credentials.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FieldShell label="JazzCash Mobile Number">
              <Input
                value={form.jazzCashNumber}
                onChange={(e) => setField("jazzCashNumber", e.target.value)}
                maxLength={200}
                placeholder="03XXXXXXXXX"
              />
            </FieldShell>
            <FieldShell label="Bank Name">
              <Input
                value={form.bankName}
                onChange={(e) => setField("bankName", e.target.value)}
                maxLength={200}
                placeholder="Raqmi Islamic Digital Bank"
              />
            </FieldShell>
            <FieldShell label="Bank Account Number">
              <Input
                value={form.bankAccountNumber}
                onChange={(e) => setField("bankAccountNumber", e.target.value)}
                maxLength={200}
                placeholder="028846199786"
              />
            </FieldShell>
            <FieldShell label="Bank Account Title">
              <Input
                value={form.bankAccountTitle}
                onChange={(e) => setField("bankAccountTitle", e.target.value)}
                maxLength={200}
                placeholder="ShafaQ Atelier"
              />
            </FieldShell>
          </div>
        </div>
      ) : null}

      {/* Automatic Gateway Status (read-only) */}
      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-serif text-lg font-medium">
          <CreditCard className="size-5 text-[var(--gold)]" />
          Automatic Gateway (JazzCash API)
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          The automatic JazzCash gateway requires real merchant credentials configured in environment variables.
          It is separate from the manual transfer method above.
        </p>
        <div className="mt-4 space-y-3">
          <PaymentStatusRow
            label="Automatic JazzCash Gateway"
            available={jazzcashGatewayConfigured}
            note={
              jazzcashGatewayConfigured
                ? "Configured via environment variables."
                : "Not configured — set PAYMENT_GATEWAY, PAYMENT_MERCHANT_ID, PAYMENT_API_KEY, PAYMENT_SECRET in .env to enable automatic gateway payments."
            }
          />
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-[var(--gold)]/20 bg-[var(--gold)]/5 px-4 py-3 text-xs text-muted-foreground">
          <AlertCircle className="mt-0.5 size-3.5 flex-none text-[var(--gold)]" />
          <p>
            Automatic JazzCash gateway credentials are stored in environment variables and are never exposed to the client. The manual transfer method above works without any gateway credentials.
          </p>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={reset}
          disabled={!dirty || saving}
          className="rounded-full"
        >
          <RotateCcw className="size-4" /> Cancel
        </Button>
        <Button
          type="button"
          onClick={save}
          disabled={!dirty || saving || noPaymentMethodEnabled}
          className="rounded-full px-6"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save className="size-4" /> Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function FieldShell({
  icon: Icon,
  label,
  children,
}: {
  icon?: typeof Store;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {Icon ? <Icon className="size-3.5" /> : null}
        {label}
      </span>
      {children}
    </Label>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-lg font-semibold">{value}</p>
    </div>
  );
}

function PaymentStatusRow({ label, available, note }: { label: string; available: boolean; note?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
      <div>
        <span className="font-medium">{label}</span>
        {note ? <p className="mt-0.5 text-xs text-muted-foreground">{note}</p> : null}
      </div>
      <span className={available ? "inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1 text-xs font-medium text-green-700" : "inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-700"}>
        {available ? <Check className="size-3.5" /> : <X className="size-3.5" />}
        {available ? "Configured" : "Not Configured"}
      </span>
    </div>
  );
}

export default AdminSettings;
