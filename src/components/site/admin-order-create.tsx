"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Search,
  Trash2,
  ShoppingCart,
  Sparkles,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import { toast } from "sonner";

type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  stock: number;
  image: string;
  colorOptions: Array<{ hex: string; name: string }>;
  sizes: string[];
  active: boolean;
};

type LineItem = {
  key: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  color: string;
  colorName: string;
  size: string;
  stock: number;
  active: boolean;
  isCustom: boolean;
};

export function AdminOrderCreate() {
  const router = useRouter();
  const [catalog, setCatalog] = React.useState<CatalogProduct[]>([]);
  const [loadingCatalog, setLoadingCatalog] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [province, setProvince] = React.useState("Punjab");
  const [postal, setPostal] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [promoCode, setPromoCode] = React.useState("");
  // Admin can choose COD or Bank Transfer. Default COD.
  const [payment, setPayment] = React.useState<"cod" | "bank_transfer">("cod");
  // For bank_transfer: optional transaction ID (admin may know it from manual reconciliation)
  const [paymentReference, setPaymentReference] = React.useState("");

  const [items, setItems] = React.useState<LineItem[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [created, setCreated] = React.useState<{ number: string; total: number } | null>(null);

  React.useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d: { products: CatalogProduct[] }) => {
        setCatalog(d.products || []);
      })
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoadingCatalog(false));
  }, []);

  const filteredCatalog = React.useMemo(() => {
    if (!search.trim()) return catalog;
    const q = search.toLowerCase();
    return catalog.filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
  }, [catalog, search]);

  const addItem = (p: CatalogProduct) => {
    const firstColor = p.colorOptions[0] || { hex: "#1a1a1a", name: "Default" };
    const firstSize = p.sizes[0] || "M";
    setItems((prev) => {
      // If product already in items, bump qty instead of duplicating
      const existing = prev.find((it) => it.productId === p.id && it.size === firstSize && it.colorName === firstColor.name);
      if (existing) {
        return prev.map((it) =>
          it.key === existing.key ? { ...it, qty: Math.min(it.qty + 1, Math.max(1, it.stock)) } : it
        );
      }
      return [
        ...prev,
        {
          key: `${p.id}-${Date.now()}`,
          productId: p.id,
          name: p.name,
          image: p.image,
          price: p.price,
          qty: 1,
          color: firstColor.hex,
          colorName: firstColor.name,
          size: firstSize,
          stock: p.stock,
          active: p.active,
          isCustom: false,
        },
      ];
    });
  };

  const addCustomItem = () => {
    setItems((prev) => [
      ...prev,
      {
        key: `custom-${Date.now()}`,
        productId: `custom-${Date.now()}`,
        name: "Custom Abaya (Made-to-Order)",
        image: "/images/custom.jpg",
        price: 21500,
        qty: 1,
        color: "#1a1a1a",
        colorName: "Black",
        size: "Custom (made-to-order)",
        stock: 0,
        active: true,
        isCustom: true,
      },
    ]);
  };

  const updateItem = (key: string, patch: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.key !== key) return it;
        const next = { ...it, ...patch };
        // Clamp qty to stock for catalog items
        if (!next.isCustom && next.stock > 0) {
          next.qty = Math.max(1, Math.min(next.qty, next.stock));
        } else {
          next.qty = Math.max(1, next.qty);
        }
        return next;
      })
    );
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  };

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const itemCount = items.reduce((s, it) => s + it.qty, 0);

  // Promo estimate (server will re-validate)
  const promoEstimate = React.useMemo(() => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return 0;
    if (code === "WELCOME10") return Math.round((subtotal * 10) / 100);
    if (code === "EID15") return Math.round((subtotal * 15) / 100);
    if (code === "ATELIER500") return Math.min(500, subtotal);
    return 0;
  }, [promoCode, subtotal]);

  const afterDiscount = Math.max(0, subtotal - promoEstimate);
  const shipping = afterDiscount >= 10000 ? 0 : (itemCount > 0 ? 350 : 0);
  const total = Math.max(0, afterDiscount + shipping);

  const validation: { ok: boolean; errors: string[] } = React.useMemo(() => {
    const errors: string[] = [];
    if (!fullName.trim()) errors.push("Customer name is required.");
    if (!phone.trim()) errors.push("Customer phone is required.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Email format is invalid.");
    if (!address.trim()) errors.push("Shipping address is required.");
    if (!city.trim()) errors.push("City is required.");
    if (!postal.trim()) errors.push("Postal code is required.");
    if (items.length === 0) errors.push("Add at least one product to the order.");
    items.forEach((it) => {
      if (!it.isCustom && it.stock < it.qty) {
        errors.push(`${it.name} only has ${it.stock} in stock (requested ${it.qty}).`);
      }
      if (!it.isCustom && !it.active) {
        errors.push(`${it.name} is inactive and cannot be ordered.`);
      }
    });
    return { ok: errors.length === 0, errors };
  }, [fullName, phone, email, address, city, postal, items]);

  const submit = async () => {
    if (!validation.ok) {
      toast.error("Please fix the errors before creating the order", {
        description: validation.errors[0],
      });
      return;
    }
    setSubmitting(true);
    setCreated(null);
    try {
      const res = await fetch("/api/admin/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(), // empty string is OK — server treats it as "(no email)"
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          province,
          postal: postal.trim(),
          notes: notes.trim() || undefined,
          promoCode: promoCode.trim() || undefined,
          payment,
          paymentReference: payment === "bank_transfer" ? paymentReference.trim() : undefined,
          items: items.map((it) => ({
            productId: it.productId,
            qty: it.qty,
            color: it.color,
            colorName: it.colorName,
            size: it.size,
          })),
        }),
      });
      const d = (await res.json()) as { ok?: boolean; error?: string; order?: { number: string; total: number } };
      if (!res.ok || !d.ok || !d.order) {
        throw new Error(d.error || "Failed to create order");
      }
      setCreated({ number: d.order.number, total: d.order.total });
      toast.success("Order created", {
        description: `${d.order.number} — ${formatPKR(d.order.total)}`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-500/10 text-green-600">
            <Check className="size-7" />
          </span>
          <h1 className="mt-4 font-serif text-2xl font-medium">Order Created</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Order <span className="font-mono font-medium">{created.number}</span> for{" "}
            <span className="font-medium">{formatPKR(created.total)}</span> was created successfully.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild className="rounded-full">
              <Link href={`/admin/orders/${created.number}`}>
                View Order Detail
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCreated(null);
                setItems([]);
                setFullName("");
                setEmail("");
                setPhone("");
                setAddress("");
                setCity("");
                setPostal("");
                setNotes("");
                setPromoCode("");
              }}
              className="rounded-full"
            >
              Create Another
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/orders")}
            className="mt-2 rounded-full text-sm"
          >
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Orders
      </Link>

      <div className="mt-4 flex flex-col gap-2">
        <span className="eyebrow text-[var(--gold)]">Order Management</span>
        <h1 className="font-serif text-2xl font-medium sm:text-3xl">Create Order</h1>
        <p className="text-sm text-muted-foreground">
          Manually create a COD order on behalf of a customer. Prices and totals are recalculated server-side.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Customer details */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-serif text-lg font-medium">
            <ShoppingCart className="size-5 text-[var(--gold)]" />
            Customer Information
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Customer Name" required>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ayesha Khan" maxLength={120} />
            </Field>
            <Field label="Phone" required>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567" maxLength={40} />
            </Field>
            <Field label="Email (optional)">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ayesha@example.com" maxLength={120} />
            </Field>
            <Field label="Province">
              <Input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Punjab" maxLength={60} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Shipping Address" required>
                <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="House #, Street, Area" maxLength={300} />
              </Field>
            </div>
            <Field label="City" required>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Okara" maxLength={60} />
            </Field>
            <Field label="Postal Code" required>
              <Input value={postal} onChange={(e) => setPostal(e.target.value)} placeholder="56300" maxLength={20} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Order Notes (optional)">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Gift wrap, delivery instructions, etc." maxLength={500} />
              </Field>
            </div>
          </div>
        </div>

        {/* Order items + summary */}
        <div className="space-y-6">
          {/* Add product */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-serif text-lg font-medium">Add Products</h2>
              <Button
                type="button"
                onClick={addCustomItem}
                size="sm"
                variant="outline"
                className="rounded-full"
              >
                <Sparkles className="size-3.5 text-[var(--gold)]" /> Add Custom Abaya
              </Button>
            </div>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search catalogue by name or SKU…"
                className="pl-9"
              />
            </div>
            <div className="mt-3 max-h-72 overflow-y-auto elegant-scroll rounded-lg border bg-secondary/20">
              {loadingCatalog ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredCatalog.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No products found.</div>
              ) : (
                <ul className="divide-y">
                  {filteredCatalog.map((p) => {
                    const added = items.some((it) => it.productId === p.id && !it.isCustom);
                    return (
                      <li
                        key={p.id}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-secondary/30"
                      >
                        <div className="size-10 flex-none overflow-hidden rounded-md border bg-secondary">
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPKR(p.price)} · Stock {p.stock}
                            {!p.active ? <span className="ml-1.5 text-red-600">· Inactive</span> : null}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addItem(p)}
                          disabled={!p.active}
                          className={cn(
                            "inline-flex size-8 items-center justify-center rounded-md transition-colors",
                            p.active
                              ? added
                                ? "text-green-600 hover:bg-green-500/10"
                                : "text-foreground hover:bg-foreground/5"
                              : "cursor-not-allowed text-muted-foreground/50"
                          )}
                          aria-label={added ? "Add another" : "Add to order"}
                          title={p.active ? "Add to order" : "Inactive product"}
                        >
                          <Plus className="size-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Line items list */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="font-serif text-lg font-medium">
              Order Items{" "}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                ({items.length} line{items.length !== 1 ? "s" : ""})
              </span>
            </h2>
            {items.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed py-8 text-center">
                <p className="text-sm text-muted-foreground">No products added yet.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {items.map((it) => (
                  <div key={it.key} className="rounded-lg border bg-background p-3">
                    <div className="flex gap-3">
                      <div className="size-12 flex-none overflow-hidden rounded-md border bg-secondary">
                        <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">
                              {it.isCustom ? (
                                <span className="inline-flex items-center gap-1">
                                  <Sparkles className="size-3 text-[var(--gold)]" /> {it.name}
                                </span>
                              ) : (
                                it.name
                              )}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatPKR(it.price)} each · {it.isCustom ? "Made-to-Order" : `Stock ${it.stock}`}
                              {!it.isCustom && !it.active ? <span className="ml-1.5 text-red-600">· Inactive</span> : null}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(it.key)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Remove item"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {!it.isCustom && catalog.find((p) => p.id === it.productId)?.colorOptions ? (
                            <select
                              value={it.colorName}
                              onChange={(e) => {
                                const c = (catalog.find((p) => p.id === it.productId)?.colorOptions || [])
                                  .find((co) => co.name === e.target.value);
                                if (c) updateItem(it.key, { color: c.hex, colorName: c.name });
                              }}
                              className="h-8 rounded-md border bg-background px-2 text-xs"
                            >
                              {catalog
                                .find((p) => p.id === it.productId)
                                ?.colorOptions.map((c) => (
                                  <option key={c.hex} value={c.name}>
                                    {c.name}
                                  </option>
                                ))}
                            </select>
                          ) : null}
                          {!it.isCustom ? (
                            <select
                              value={it.size}
                              onChange={(e) => updateItem(it.key, { size: e.target.value })}
                              className="h-8 rounded-md border bg-background px-2 text-xs"
                            >
                              {(catalog.find((p) => p.id === it.productId)?.sizes || ["M"]).map((s) => (
                                <option key={s} value={s}>
                                  Size {s}
                                </option>
                              ))}
                            </select>
                          ) : null}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateItem(it.key, { qty: Math.max(1, it.qty - 1) })}
                              className="inline-flex size-8 items-center justify-center rounded-md border text-sm hover:bg-secondary"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <Input
                              type="number"
                              value={it.qty}
                              onChange={(e) => updateItem(it.key, { qty: Math.max(1, Number(e.target.value) || 1) })}
                              className="h-8 w-16 text-center text-xs"
                              min={1}
                              max={it.isCustom ? undefined : Math.max(1, it.stock)}
                            />
                            <button
                              type="button"
                              onClick={() => updateItem(it.key, { qty: it.qty + 1 })}
                              disabled={!it.isCustom && it.qty >= it.stock}
                              className="inline-flex size-8 items-center justify-center rounded-md border text-sm hover:bg-secondary disabled:opacity-40"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <span className="ml-auto font-serif font-semibold">
                            {formatPKR(it.price * it.qty)}
                          </span>
                        </div>
                        {!it.isCustom && it.stock < it.qty ? (
                          <p className="mt-1.5 text-xs text-destructive">
                            Requested qty exceeds stock ({it.stock}). Reduce quantity to continue.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="font-serif text-lg font-medium">Order Summary</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <Field label="Promo Code (optional)">
              <Input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="WELCOME10 / ATELIER500 / EID15"
                className="max-w-xs font-mono uppercase"
                maxLength={20}
              />
            </Field>
            {promoEstimate > 0 ? (
              <p className="mt-1.5 text-xs text-green-600">
                Promo applied — estimated discount {formatPKR(promoEstimate)}. Server re-validates on creation.
              </p>
            ) : promoCode.trim() ? (
              <p className="mt-1.5 text-xs text-amber-600">Unknown promo code — no discount will apply.</p>
            ) : null}
            {/* Payment method selector */}
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Payment Method</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPayment("cod")}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    payment === "cod"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-foreground/30"
                  )}
                >
                  Cash on Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setPayment("bank_transfer")}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    payment === "bank_transfer"
                      ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--mocha)]"
                      : "border-border hover:border-foreground/30"
                  )}
                >
                  JazzCash / Bank Transfer
                </button>
              </div>
              {payment === "bank_transfer" ? (
                <div className="mt-2">
                  <Field label="Payment Reference / Transaction ID (optional)">
                    <Input
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="e.g. TXN123456789 — leave blank if you will verify later"
                      maxLength={100}
                      className="font-mono"
                    />
                  </Field>
                  <p className="mt-1 text-[0.65rem] text-muted-foreground">
                    Order will be created with payment status <span className="font-medium">pending</span>. You can verify the payment from the order detail page after creation.
                  </p>
                </div>
              ) : (
                <p className="text-[0.65rem] text-muted-foreground">
                  Order will be created with payment method <span className="font-medium">Cash on Delivery</span>. Status: <span className="font-medium">processing</span>.
                </p>
              )}
            </div>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
              <span>{formatPKR(subtotal)}</span>
            </div>
            {promoEstimate > 0 ? (
              <div className="flex justify-between text-[var(--gold)]">
                <span>Discount (estimated)</span>
                <span>−{formatPKR(promoEstimate)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{shipping === 0 ? "Free" : formatPKR(shipping)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-serif font-medium">Grand Total</span>
              <span className="font-serif text-lg font-semibold">{formatPKR(total)}</span>
            </div>
            <p className="pt-1 text-[0.65rem] text-muted-foreground">
              Final totals are recalculated server-side from the live catalogue. Status: processing.
            </p>
          </div>
        </div>
      </div>

      {/* Validation + actions */}
      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        {!validation.ok ? (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="size-4" /> Please fix before creating the order
            </p>
            <ul className="mt-2 list-disc pl-8 text-xs text-destructive/80">
              {validation.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/admin/orders")}
            disabled={submitting}
            className="rounded-full"
          >
            <X className="size-4" /> Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={!validation.ok || submitting || items.length === 0}
            className="rounded-full px-6"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Creating Order…
              </>
            ) : (
              <>
                <Plus className="size-4" /> Create Order
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label} {required ? <span className="text-[var(--gold)]">*</span> : null}
      </span>
      {children}
    </Label>
  );
}

export default AdminOrderCreate;
