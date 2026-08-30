"use client";

import * as React from "react";
import { X, Loader2, Plus, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ALL_SIZES, type ColorOption } from "@/lib/site-data";
import { toast } from "sonner";

const CATEGORIES = ["Daily Wear", "New Arrivals", "Best Sellers"] as const;

const COLOR_PRESETS: ColorOption[] = [
  { hex: "#1a1a1a", name: "Black" },
  { hex: "#6b5246", name: "Mocha" },
  { hex: "#d8c7a8", name: "Beige" },
  { hex: "#e8dcc4", name: "Cream" },
  { hex: "#3a3633", name: "Charcoal" },
  { hex: "#c9a24b", name: "Gold" },
  { hex: "#85735e", name: "Taupe" },
  { hex: "#5b6b5b", name: "Sage" },
];

type ProductForm = {
  name: string;
  category: string;
  price: string;
  originalPrice: string;
  image: string;
  badge: string;
  fabric: string;
  care: string;
  description: string;
  stock: string;
  colors: ColorOption[];
  sizes: string[];
};

const EMPTY_FORM: ProductForm = {
  name: "",
  category: "Daily Wear",
  price: "",
  originalPrice: "",
  image: "",
  badge: "",
  fabric: "",
  care: "",
  description: "",
  stock: "50",
  colors: [{ hex: "#1a1a1a", name: "Black" }],
  sizes: [...ALL_SIZES],
};

export function ProductCreateModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}) {
  const [form, setForm] = React.useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setForm(EMPTY_FORM), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const setField = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleColor = (c: ColorOption) => {
    setForm((f) => ({
      ...f,
      colors: f.colors.find((x) => x.hex === c.hex)
        ? f.colors.filter((x) => x.hex !== c.hex)
        : [...f.colors, c],
    }));
  };

  const toggleSize = (s: string) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(s)
        ? f.sizes.filter((x) => x !== s)
        : [...f.sizes, s],
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    if (!form.image.trim()) {
      toast.error("Product image URL is required");
      return;
    }
    if (form.colors.length === 0) {
      toast.error("Please select at least one colour");
      return;
    }
    if (form.sizes.length === 0) {
      toast.error("Please select at least one size");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category,
          price: Number(form.price),
          originalPrice: form.originalPrice
            ? Number(form.originalPrice)
            : undefined,
          image: form.image.trim(),
          colorOptions: form.colors,
          sizes: form.sizes,
          badge: form.badge.trim() || undefined,
          fabric: form.fabric.trim(),
          care: form.care.trim(),
          description: form.description.trim(),
          stock: Number(form.stock) || 0,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to create product");
      }
      toast.success("Product created", {
        description: `${form.name} added to the catalogue.`,
      });
      onCreated?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border bg-background p-0">
        <DialogTitle className="sr-only">Create new product</DialogTitle>
        <DialogDescription className="sr-only">
          Add a new abaya to the ShafaQ Atelier catalogue
        </DialogDescription>

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Plus className="size-5 text-[var(--gold)]" />
            <h2 className="font-serif text-lg font-medium">New Product</h2>
          </div>
        </div>

        {/* Body */}
        <form
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto elegant-scroll px-6 py-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Name */}
            <Label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Product name <span className="text-[var(--gold)]">*</span>
              </span>
              <Input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Noor Everyday Abaya"
              />
            </Label>

            {/* Category */}
            <Label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Category
              </span>
              <select
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Label>

            {/* Badge */}
            <Label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Badge (optional)
              </span>
              <Input
                value={form.badge}
                onChange={(e) => setField("badge", e.target.value)}
                placeholder="e.g. Just In, Best Seller"
              />
            </Label>

            {/* Price */}
            <Label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Price (PKR) <span className="text-[var(--gold)]">*</span>
              </span>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                placeholder="7400"
                min={0}
              />
            </Label>

            {/* Original price */}
            <Label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Original price (optional)
              </span>
              <Input
                type="number"
                value={form.originalPrice}
                onChange={(e) => setField("originalPrice", e.target.value)}
                placeholder="14500"
                min={0}
              />
            </Label>

            {/* Stock */}
            <Label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Stock quantity
              </span>
              <Input
                type="number"
                value={form.stock}
                onChange={(e) => setField("stock", e.target.value)}
                placeholder="50"
                min={0}
              />
            </Label>

            {/* Image URL */}
            <Label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Image URL <span className="text-[var(--gold)]">*</span>
              </span>
              <div className="flex gap-2">
                <Input
                  value={form.image}
                  onChange={(e) => setField("image", e.target.value)}
                  placeholder="/images/my-abaya.jpg"
                />
                {form.image ? (
                  <div className="size-9 flex-none overflow-hidden rounded-md border bg-secondary">
                    <img
                      src={form.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex size-9 flex-none items-center justify-center rounded-md border bg-secondary">
                    <ImageIcon className="size-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            </Label>

            {/* Fabric */}
            <Label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Fabric
              </span>
              <Input
                value={form.fabric}
                onChange={(e) => setField("fabric", e.target.value)}
                placeholder="Premium matte crepe"
              />
            </Label>

            {/* Care */}
            <Label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Care instructions
              </span>
              <Input
                value={form.care}
                onChange={(e) => setField("care", e.target.value)}
                placeholder="Dry clean recommended"
              />
            </Label>

            {/* Description */}
            <Label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Description
              </span>
              <Textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Describe the abaya's silhouette, details, and feel…"
                rows={3}
              />
            </Label>

            {/* Colours */}
            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Colours ({form.colors.length} selected)
              </span>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((c) => {
                  const selected = form.colors.find((x) => x.hex === c.hex);
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => toggleColor(c)}
                      title={c.name}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all",
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground/40"
                      )}
                    >
                      <span
                        className="size-3 rounded-full ring-1 ring-inset ring-black/10"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sizes */}
            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Sizes ({form.sizes.length} selected)
              </span>
              <div className="flex flex-wrap gap-2">
                {ALL_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(s)}
                    aria-pressed={form.sizes.includes(s)}
                    className={cn(
                      "inline-flex h-9 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-medium transition-all",
                      form.sizes.includes(s)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-foreground/40"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={saving}
            className="rounded-full px-6"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <Plus className="size-4" /> Create Product
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProductCreateModal;
