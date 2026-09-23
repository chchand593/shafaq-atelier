"use client";

import * as React from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  Truck,
  CreditCard,
  ShieldCheck,
  Package,
  CheckCircle2,
  Copy,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  useUI,
  useCart,
  usePromo,
  cartCount,
  cartSubtotal,
  promoDiscount,
  shippingCost,
  FREE_SHIPPING_THRESHOLD,
  type CheckoutStep,
} from "@/lib/store";
import { formatPKR } from "@/lib/format";

const STEPS: { id: CheckoutStep; label: string; icon: typeof Truck }[] = [
  { id: "information", label: "Information", icon: Truck },
  { id: "shipping", label: "Shipping", icon: Package },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "review", label: "Review", icon: ShieldCheck },
];

function Stepper({ step }: { step: CheckoutStep }) {
  if (step === "done") return null;
  const activeIdx = STEPS.findIndex((s) => s.id === step);
  return (
    <ol className="flex items-center justify-center gap-1 sm:gap-2">
      {STEPS.map((s, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        const Icon = s.icon;
        return (
          <li key={s.id} className="flex items-center gap-1 sm:gap-2">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border text-xs transition-all sm:size-9",
                  done && "border-primary bg-primary text-primary-foreground",
                  active &&
                    "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)] ring-2 ring-[var(--gold)]/30",
                  !done && !active && "border-border text-muted-foreground"
                )}
              >
                {done ? <Check className="size-4" /> : <Icon className="size-4" />}
              </span>
              <span
                className={cn(
                  "hidden text-[0.65rem] uppercase tracking-wider sm:block",
                  active ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 ? (
              <span
                className={cn(
                  "h-px w-6 sm:w-10",
                  i < activeIdx ? "bg-primary" : "bg-border"
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function OrderSummary({
  subtotal,
  discount,
  shipping,
  total,
}: {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}) {
  return (
    <div className="rounded-xl border bg-secondary/40 p-4">
      <h3 className="eyebrow text-[var(--mocha)]">Order Summary</h3>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-medium">{formatPKR(subtotal)}</dd>
        </div>
        {discount > 0 ? (
          <div className="flex justify-between text-[var(--gold)]">
            <dt>Discount</dt>
            <dd>−{formatPKR(discount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="font-medium">
            {shipping === 0 ? "Free" : formatPKR(shipping)}
          </dd>
        </div>
        <Separator className="my-2" />
        <div className="flex items-baseline justify-between">
          <dt className="font-serif text-base font-medium">Total</dt>
          <dd className="font-serif text-xl font-semibold">{formatPKR(total)}</dd>
        </div>
        <p className="text-xs text-muted-foreground">
          {subtotal < FREE_SHIPPING_THRESHOLD
            ? `Add ${formatPKR(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping`
            : "You’ve unlocked free shipping"}
        </p>
      </dl>
    </div>
  );
}

function InformationStep({
  form,
  setField,
}: {
  form: CheckoutForm;
  setField: (k: keyof CheckoutForm, v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-xl font-medium">Contact</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Full name" required>
            <Input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Ayesha Khan"
              autoComplete="name"
            />
          </Field>
          <Field label="Phone" required>
            <Input
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="+92 300 1234567"
              autoComplete="tel"
            />
          </Field>
          <Field label="Email" required className="sm:col-span-2">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function ShippingStep({
  form,
  setField,
}: {
  form: CheckoutForm;
  setField: (k: keyof CheckoutForm, v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-xl font-medium">Delivery Address</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Address" required className="sm:col-span-2">
            <Input
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="House 12, Street 5"
              autoComplete="address-line1"
            />
          </Field>
          <Field label="City" required>
            <Input
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
              placeholder="Okara"
              autoComplete="address-level2"
            />
          </Field>
          <Field label="Province" required>
            <Input
              value={form.province}
              onChange={(e) => setField("province", e.target.value)}
              placeholder="Punjab"
              autoComplete="address-level1"
            />
          </Field>
          <Field label="Postal code" required>
            <Input
              value={form.postal}
              onChange={(e) => setField("postal", e.target.value)}
              placeholder="54000"
              autoComplete="postal-code"
            />
          </Field>
          <Field label="Order notes (optional)">
            <Input
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Leave at the gate with guard"
            />
          </Field>
        </div>
      </div>
      <div className="rounded-lg border bg-secondary/40 p-3">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Truck className="size-4 text-[var(--gold)]" />
          Standard delivery · 3–5 business days
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Carefully packaged and dispatched within 1–2 business days.
        </p>
      </div>
    </div>
  );
}

function PaymentStep({
  form,
  setField,
}: {
  form: CheckoutForm;
  setField: (k: keyof CheckoutForm, v: string) => void;
}) {
  const [config, setConfig] = React.useState<{
    onlinePaymentAvailable?: boolean;
    codEnabled?: boolean;
    manualTransferEnabled?: boolean;
    manualTransfer?: {
      jazzCashNumber: string;
      bankName: string;
      bankAccountNumber: string;
      bankAccountTitle: string;
    };
  }>({});

  React.useEffect(() => {
    // Fetch payment config with retry — the dev/prod server may briefly return
    // a 502 (e.g. during cold start or memory pressure). Without retry, the
    // checkout would incorrectly show manual transfer as "OFF" even though
    // it's enabled in the database.
    let attempts = 0;
    let cancelled = false;
    const fetchConfig = async () => {
      attempts++;
      try {
        const r = await fetch("/api/payments/config");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        if (!cancelled) setConfig(d);
      } catch {
        if (attempts < 3 && !cancelled) {
          setTimeout(fetchConfig, 800 * attempts);
        } else if (!cancelled) {
          // Give up — default to empty config (COD only, safe fallback)
          setConfig({});
        }
      }
    };
    fetchConfig();
    return () => { cancelled = true; };
  }, []);

  const codAvailable = config.codEnabled !== false; // default true if undefined
  const manualAvailable = config.manualTransferEnabled === true;
  const onlineAvailable = !!config.onlinePaymentAvailable;

  const methods = [
    {
      id: "cod" as const,
      label: "Cash on Delivery",
      desc: "Pay when your abaya arrives at your doorstep.",
      available: codAvailable,
    },
    {
      id: "bank_transfer" as const,
      label: "JazzCash / Bank Transfer",
      desc: "Pay manually via JazzCash or bank transfer. Admin verifies your payment.",
      available: manualAvailable,
    },
    {
      id: "online" as const,
      label: "Online Payment",
      desc: onlineAvailable ? "Pay securely via JazzCash gateway." : "Automatic JazzCash gateway (requires merchant credentials).",
      available: onlineAvailable,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-xl font-medium">Payment Method</h2>
        <div className="mt-3 space-y-2">
          {methods.map((m) => (
            <label
              key={m.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 transition-all",
                m.available
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-60",
                form.payment === m.id && m.available
                  ? "border-[var(--gold)] ring-2 ring-[var(--gold)]/30 bg-[var(--gold)]/5"
                  : "hover:border-foreground/30"
              )}
            >
              <input
                type="radio"
                name="payment"
                value={m.id}
                checked={form.payment === m.id}
                disabled={!m.available}
                onChange={(e) => m.available && setField("payment", e.target.value)}
                className="mt-0.5 size-4 accent-[var(--gold)]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{m.label}</p>
                  {!m.available ? (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wider text-muted-foreground">
                      {m.id === "online" ? "Soon" : "Off"}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {/* COD info */}
        {form.payment === "cod" ? (
          <div className="mt-3 rounded-lg border bg-secondary/40 p-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Truck className="size-4 text-[var(--gold)]" />
              Cash on Delivery
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your order will be processed immediately. Pay in cash when your
              abaya is delivered to your door. No advance payment needed.
            </p>
          </div>
        ) : null}

        {/* Bank transfer info + instructions + transaction ID */}
        {form.payment === "bank_transfer" && manualAvailable ? (
          <BankTransferInstructions
            config={config}
            form={form}
            setField={setField}
          />
        ) : null}

        {/* Online payment info */}
        {form.payment === "online" ? (
          <div className="mt-3 rounded-lg border bg-secondary/40 p-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Lock className="size-4 text-[var(--gold)]" />
              {onlineAvailable ? "Redirecting to JazzCash" : "Online Payment — Coming Soon"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {onlineAvailable
                ? "You will be redirected to the JazzCash gateway to complete your payment securely."
                : "We are integrating the automatic JazzCash gateway. For now, please select Cash on Delivery or Manual Bank Transfer to complete your order."}
            </p>
          </div>
        ) : null}

        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3" />
          Your order is processed securely. Prices are calculated server-side
          for your protection.
        </p>
      </div>
    </div>
  );
}

// Premium manual bank-transfer instructions box with copy buttons + transaction ID field.
function BankTransferInstructions({
  config,
  form,
  setField,
}: {
  config: {
    manualTransfer?: {
      jazzCashNumber: string;
      bankName: string;
      bankAccountNumber: string;
      bankAccountTitle: string;
    };
  };
  form: CheckoutForm;
  setField: (k: keyof CheckoutForm, v: string) => void;
}) {
  const mt = config.manualTransfer;
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const copy = (label: string, value: string) => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 1500);
    });
  };

  if (!mt) {
    return (
      <div className="mt-3 rounded-lg border bg-secondary/40 p-3 text-xs text-muted-foreground">
        Loading payment instructions…
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Payment instructions box */}
      <div className="rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-[var(--mocha)]">
          <CreditCard className="size-4 text-[var(--gold)]" />
          Payment Instructions
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Send the total amount to one of the methods below, then enter the transaction / reference ID at the bottom of this box.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {/* JazzCash row */}
          <div className="rounded-md border bg-background p-3">
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              JazzCash
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-medium">{mt.jazzCashNumber}</p>
                <p className="text-[0.65rem] text-muted-foreground">Mobile Number</p>
              </div>
              <button
                type="button"
                onClick={() => copy("jazzcash", mt.jazzCashNumber)}
                className="inline-flex size-8 flex-none items-center justify-center rounded-md border transition-colors hover:border-foreground/40"
                aria-label="Copy JazzCash number"
                title="Copy JazzCash number"
              >
                {copiedField === "jazzcash" ? (
                  <Check className="size-3.5 text-[var(--gold)]" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Bank account row */}
          <div className="rounded-md border bg-background p-3">
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              {mt.bankName}
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-medium">{mt.bankAccountNumber}</p>
                <p className="text-[0.65rem] text-muted-foreground">{mt.bankAccountTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => copy("bank", mt.bankAccountNumber)}
                className="inline-flex size-8 flex-none items-center justify-center rounded-md border transition-colors hover:border-foreground/40"
                aria-label="Copy account number"
                title="Copy account number"
              >
                {copiedField === "bank" ? (
                  <Check className="size-3.5 text-[var(--gold)]" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-md border bg-background/50 p-2.5 text-[0.7rem] text-muted-foreground">
          <p className="font-medium text-foreground">Account Title: {mt.bankAccountTitle}</p>
          <p className="mt-0.5">After transferring, enter the transaction / reference ID below. Your order will be reviewed by our team.</p>
        </div>
      </div>

      {/* Transaction / Reference ID input */}
      <div>
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            Payment Reference / Transaction ID
            <span className="text-[var(--gold)]">*</span>
          </span>
          <Input
            value={form.paymentReference}
            onChange={(e) => setField("paymentReference", e.target.value)}
            placeholder="e.g. TXN123456789 or JazzCash Trx ID"
            maxLength={100}
            className="font-mono"
            required
          />
        </label>
        <p className="mt-1 text-[0.65rem] text-muted-foreground">
          Enter the transaction / reference ID you received after making the payment.
          Our team will verify your payment before your order is shipped.
        </p>
      </div>

      {/* Optional screenshot note (not supported in this build — no insecure public upload) */}
      <div className="rounded-md border border-dashed bg-secondary/30 p-3 text-[0.7rem] text-muted-foreground">
        <p className="font-medium text-foreground">Payment screenshot (optional)</p>
        <p className="mt-0.5">
          Screenshot upload is currently disabled. If you have a screenshot, please send it to{" "}
          <a href="mailto:hello@shafaqatelier.pk" className="text-[var(--gold)] hover:underline">hello@shafaqatelier.pk</a>{" "}
          along with your order number after placing the order.
        </p>
      </div>
    </div>
  );
}

function ReviewStep({
  form,
  subtotal,
  discount,
  shipping,
  total,
}: {
  form: CheckoutForm;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}) {
  const paymentLabel =
    form.payment === "cod"
      ? "Cash on Delivery"
      : form.payment === "bank_transfer"
        ? "JazzCash / Bank Transfer"
        : "Online Payment";
  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl font-medium">Review Your Order</h2>
      <div className="rounded-lg border p-4">
        <h3 className="eyebrow text-[var(--mocha)]">Delivering to</h3>
        <p className="mt-2 text-sm">{form.name}</p>
        <p className="text-sm text-muted-foreground">{form.address}</p>
        <p className="text-sm text-muted-foreground">
          {form.city}, {form.province} {form.postal}
        </p>
        <p className="text-sm text-muted-foreground">{form.phone}</p>
      </div>
      <OrderSummary
        subtotal={subtotal}
        discount={discount}
        shipping={shipping}
        total={total}
      />
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Payment Method</span>
        <span className="font-medium">{paymentLabel}</span>
      </div>
      {form.payment === "bank_transfer" && form.paymentReference ? (
        <div className="rounded-md border bg-secondary/30 p-3 text-xs">
          <p className="text-muted-foreground">Payment Reference / Transaction ID</p>
          <p className="mt-0.5 font-mono font-medium text-foreground">{form.paymentReference}</p>
        </div>
      ) : null}
      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input type="checkbox" defaultChecked className="mt-0.5 size-4 accent-[var(--gold)]" />
        I agree to the ShafaQ Atelier Terms of Service and Privacy Policy.
      </label>
    </div>
  );
}

function ConfirmationStep({
  orderId,
  total,
  email,
}: {
  orderId: string;
  total: number;
  email: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-[var(--gold)]/15 text-[var(--gold)]">
        <CheckCircle2 className="size-10" />
      </div>
      <h2 className="mt-5 font-serif text-2xl font-medium sm:text-3xl">
        Thank you for your order
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Your abaya is being prepared with care. A confirmation has been sent to{" "}
        <span className="font-medium text-foreground">{email || "your email"}</span>.
      </p>
      <button
        type="button"
        onClick={copy}
        className="mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:border-foreground/40"
      >
        <span className="text-muted-foreground">Order</span>
        <span className="font-mono font-medium">{orderId}</span>
        <Copy className="size-3.5 text-muted-foreground" />
        {copied ? <span className="text-xs text-[var(--gold)]">Copied!</span> : null}
      </button>
      <div className="mt-6 w-full max-w-xs rounded-xl border bg-secondary/40 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total paid</span>
          <span className="font-serif text-lg font-semibold">{formatPKR(total)}</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <Package className="size-4 text-[var(--gold)]" />
          <span>Arriving in 3–5 business days</span>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
        {required ? <span className="text-[var(--gold)]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

type CheckoutForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal: string;
  notes: string;
  payment: "cod" | "bank_transfer" | "online";
  paymentReference: string; // customer-supplied transaction/reference ID for bank_transfer
};

const EMPTY_FORM: CheckoutForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  postal: "",
  notes: "",
  payment: "cod",
  paymentReference: "",
};

function CheckoutInner() {
  const { checkoutStep, setCheckoutStep, setCheckoutOpen, setLastOrder, lastOrder } =
    useUI();
  const { lines, clear } = useCart();
  const promo = usePromo((s) => s.applied);

  const [form, setForm] = React.useState<CheckoutForm>(EMPTY_FORM);
  const setField = (k: keyof CheckoutForm, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Capture the order total at placement time so the confirmation screen
  // shows the correct amount even after the cart is cleared.
  const [placedTotal, setPlacedTotal] = React.useState(0);

  const count = cartCount(lines);
  const subtotal = cartSubtotal(lines);
  const discount = promoDiscount(subtotal, promo);
  const shipping = shippingCost(subtotal - discount, count);
  const total = Math.max(0, subtotal - discount + shipping);

  const validateStep = (step: CheckoutStep): string | null => {
    if (step === "information") {
      if (!form.name.trim()) return "Please enter your name";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email";
      if (form.phone.trim().length < 7) return "Enter a valid phone number";
    }
    if (step === "shipping") {
      if (!form.address.trim()) return "Please enter your address";
      if (!form.city.trim()) return "Please enter your city";
      if (!form.province.trim()) return "Please enter your province";
      if (!form.postal.trim()) return "Please enter your postal code";
    }
    if (step === "payment") {
      if (form.payment === "bank_transfer") {
        if (!form.paymentReference.trim()) {
          return "Please enter your payment transaction / reference ID";
        }
      }
    }
    return null;
  };

  const [placing, setPlacing] = React.useState(false);

  const next = async () => {
    const err = validateStep(checkoutStep);
    if (err) {
      import("sonner").then(({ toast }) =>
        toast.error(err, { description: "Please complete this step to continue." })
      );
      return;
    }
    const order: CheckoutStep[] = [
      "information",
      "shipping",
      "payment",
      "review",
    ];
    const idx = order.indexOf(checkoutStep);
    if (idx < order.length - 1) {
      setCheckoutStep(order[idx + 1]);
      return;
    }
    if (checkoutStep !== "review") return;

    // place order — capture total BEFORE clearing the cart
    setPlacing(true);
    setPlacedTotal(total);
    // Generate a unique client token for duplicate prevention
    const clientToken = `ct-${Date.now()}-${Math.random().toString(36).slice(-8)}`;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({
            productId: l.productId,
            name: l.name,
            image: l.image,
            price: l.price,
            qty: l.qty,
            color: l.color,
            colorName: l.colorName,
            size: l.size,
            customization: l.customization ?? null,
          })),
          email: form.email,
          fullName: form.name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          province: form.province,
          postal: form.postal,
          notes: form.notes,
          payment: form.payment,
          paymentReference: form.paymentReference.trim(),
          promoCode: promo?.code,
          clientToken,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        order?: { number: string };
        redirectData?: { url?: string; postData?: Record<string, string> };
        error?: string;
      };
      if (!res.ok || !data.order) {
        throw new Error(data.error || "Order failed");
      }
      setLastOrder(data.order.number);

      // If online payment, redirect to gateway
      if (data.redirectData?.url && data.redirectData?.postData) {
        // Create a hidden form and submit to JazzCash
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.redirectData.url;
        for (const [key, value] of Object.entries(data.redirectData.postData)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        return; // Don't clear cart yet — will be handled after payment
      }

      // COD: proceed to confirmation
      setCheckoutStep("done");
      clear();
      const orderNumber = data.order.number;
      import("sonner").then(({ toast }) =>
        toast.success("Order placed", {
          description: `Your order ${orderNumber} is confirmed.`,
        })
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Order failed";
      import("sonner").then(({ toast }) =>
        toast.error("Could not place order", { description: msg })
      );
      // fall back to a local order id so the user still sees confirmation
      const fallback = "LM-" + Date.now().toString(36).toUpperCase().slice(-8);
      setLastOrder(fallback);
      setCheckoutStep("done");
      clear();
    } finally {
      setPlacing(false);
    }
  };

  const back = () => {
    const order: CheckoutStep[] = [
      "information",
      "shipping",
      "payment",
      "review",
    ];
    const idx = order.indexOf(checkoutStep);
    if (idx > 0) setCheckoutStep(order[idx - 1]);
  };

  const close = () => {
    setCheckoutOpen(false);
    // reset step after close animation so reopening starts fresh (unless done stays as confirmation)
    setTimeout(() => {
      if (useUI.getState().checkoutStep === "done") {
        setCheckoutStep("information");
        setLastOrder(null);
        setPlacedTotal(0);
        setForm(EMPTY_FORM);
      }
    }, 250);
  };

  return (
    <DialogContent
      className="flex max-h-[94vh] w-full max-w-4xl flex-col gap-0 overflow-hidden rounded-xl border bg-background p-0 sm:max-w-4xl"
      showCloseButton
      onEscapeKeyDown={close}
      onPointerDownOutside={close}
    >
      <DialogTitle className="sr-only">Checkout</DialogTitle>
      <DialogDescription className="sr-only">
        Complete your purchase in a few steps
      </DialogDescription>

      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-4 sm:px-7">
        <div>
          <p className="eyebrow text-[var(--gold)]">ShafaQ Atelier</p>
          <h2 className="font-serif text-lg font-medium sm:text-xl">
            {checkoutStep === "done" ? "Order Confirmed" : "Secure Checkout"}
          </h2>
        </div>
        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          <Lock className="size-3.5 text-[var(--gold)]" />
          256-bit encrypted
        </span>
      </div>

      {checkoutStep === "done" ? (
        <div className="overflow-y-auto elegant-scroll px-5 py-2 sm:px-7">
          <ConfirmationStep
            orderId={lastOrder || "LM-XXXX"}
            total={placedTotal}
            email={form.email}
          />
          <div className="flex flex-col items-center gap-3 pb-6 sm:flex-row sm:justify-center">
            <Button asChild className="rounded-full px-8">
              <a href={`/order/${lastOrder || ""}`}>
                <Package className="size-4" /> Track My Order
              </a>
            </Button>
            <Button onClick={close} variant="outline" className="rounded-full px-8">
              Continue Shopping
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_340px]">
          {/* Form column */}
          <div className="flex flex-col overflow-y-auto elegant-scroll px-5 py-5 sm:px-7">
            <Stepper step={checkoutStep} />
            <div className="mt-6 flex-1">
              {checkoutStep === "information" ? (
                <InformationStep form={form} setField={setField} />
              ) : null}
              {checkoutStep === "shipping" ? (
                <ShippingStep form={form} setField={setField} />
              ) : null}
              {checkoutStep === "payment" ? (
                <PaymentStep form={form} setField={setField} />
              ) : null}
              {checkoutStep === "review" ? (
                <ReviewStep
                  form={form}
                  subtotal={subtotal}
                  discount={discount}
                  shipping={shipping}
                  total={total}
                />
              ) : null}
            </div>

            {/* Nav buttons */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={checkoutStep === "information" ? close : back}
                className="rounded-full"
              >
                <ChevronLeft className="size-4" />
                {checkoutStep === "information" ? "Cancel" : "Back"}
              </Button>
              <Button
                onClick={next}
                disabled={placing}
                className="rounded-full px-7 text-sm font-medium uppercase tracking-wider"
              >
                {placing
                  ? "Placing…"
                  : checkoutStep === "review"
                    ? "Place Order"
                    : "Continue"}
                {!placing ? <ChevronRight className="size-4" /> : null}
              </Button>
            </div>
          </div>

          {/* Summary column (desktop) */}
          <aside className="hidden flex-col border-l bg-secondary/30 px-5 py-5 lg:flex">
            <h3 className="eyebrow text-[var(--mocha)]">In Your Bag ({count})</h3>
            <ul className="mt-3 max-h-64 space-y-3 overflow-y-auto elegant-scroll pr-1">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-3">
                  <div className="relative size-14 flex-none overflow-hidden rounded-md border bg-background">
                    <img
                      src={l.image}
                      alt={l.name}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute -right-1 -top-1 inline-flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] text-primary-foreground">
                      {l.qty}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.colorName} · {l.size}
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    {formatPKR(l.price * l.qty)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <OrderSummary
                subtotal={subtotal}
                discount={discount}
                shipping={shipping}
                total={total}
              />
            </div>
          </aside>
        </div>
      )}
    </DialogContent>
  );
}

export function Checkout() {
  const { checkoutOpen, setCheckoutOpen } = useUI();
  return (
    <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
      <CheckoutInner />
    </Dialog>
  );
}

export default Checkout;
