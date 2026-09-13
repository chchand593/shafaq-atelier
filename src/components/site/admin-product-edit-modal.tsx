"use client";

import * as React from "react";
import {
  Loader2,
  Image as ImageIcon,
  X,
  Save,
  AlertCircle,
  Plus,
  ChevronUp,
  ChevronDown,
  Star,
  Trash2,
  Pencil,
} from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ColorImage, ColorOption } from "@/lib/site-data";
import { ImageUpload } from "@/components/site/image-upload";
import { toast } from "sonner";

/**
 * AdminProduct shape passed in from the parent admin-products table. We only
 * need a few fields for the trigger; the full data is fetched on open.
 */
type AdminProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  lowStockThreshold: number;
  active: boolean;
  badge?: string;
  image: string;
  colorOptions?: ColorOption[];
  colorImages?: ColorImage[];
};

const CATEGORIES = ["Daily Wear", "New Arrivals", "Best Sellers"] as const;

/**
 * Editable form state. We keep colors as an array of ColorOption (editable
 * inline) and a parallel map keyed by lowercased hex → list of image URLs.
 */
type EditForm = {
  name: string;
  category: string;
  price: string;
  originalPrice: string;
  badge: string;
  stock: string;
  lowStockThreshold: string;
  description: string;
  fabric: string;
  care: string;
  active: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  colors: ColorOption[];
  colorImages: Record<string, string[]>;
  images: string[];
};

const EMPTY_FORM: EditForm = {
  name: "",
  category: "Daily Wear",
  price: "",
  originalPrice: "",
  badge: "",
  stock: "",
  lowStockThreshold: "5",
  description: "",
  fabric: "",
  care: "",
  active: true,
  isNewArrival: false,
  isBestSeller: false,
  isFeatured: false,
  colors: [],
  colorImages: {},
  images: [],
};

/**
 * Build the initial form state from a fetched product payload.
 */
function hydrate(p: {
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  lowStockThreshold: number;
  active: boolean;
  badge?: string;
  description: string;
  fabric: string;
  care: string;
  images?: string[];
  colorOptions?: ColorOption[];
  colorImages?: ColorImage[];
}): EditForm {
  const colorImages: Record<string, string[]> = {};
  for (const ci of p.colorImages ?? []) {
    const key = (ci.colorHex || "").toLowerCase();
    const urls = [ci.image, ...(ci.images ?? [])].filter(
      (u): u is string => typeof u === "string" && u.trim().length > 0
    );
    if (key) colorImages[key] = urls;
  }

  return {
    name: p.name || "",
    category: CATEGORIES.includes(p.category as (typeof CATEGORIES)[number])
      ? p.category
      : "Daily Wear",
    price: String(p.price ?? ""),
    originalPrice: p.originalPrice ? String(p.originalPrice) : "",
    badge: p.badge ?? "",
    stock: String(p.stock ?? 0),
    lowStockThreshold: String(p.lowStockThreshold ?? 5),
    description: p.description ?? "",
    fabric: p.fabric ?? "",
    care: p.care ?? "",
    active: p.active,
    isNewArrival: (p as any).isNewArrival ?? false,
    isBestSeller: (p as any).isBestSeller ?? false,
    isFeatured: (p as any).isFeatured ?? false,
    colors: (p.colorOptions ?? []).map((c) => ({ hex: c.hex, name: c.name })),
    colorImages,
    images: Array.isArray(p.images) ? [...p.images] : [],
  };
}

export function AdminProductEditModal({
  open,
  onOpenChange,
  product,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: AdminProduct | null;
  onSaved?: () => void;
}) {
  const [form, setForm] = React.useState<EditForm>(EMPTY_FORM);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Reset internal state when the modal closes (delayed to avoid flashes).
  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setForm(EMPTY_FORM);
        setLoadError(null);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Fetch the FULL product payload whenever the modal opens for a product.
  React.useEffect(() => {
    if (!open || !product) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const res = await fetch("/api/admin/products");
        if (!res.ok) throw new Error("Failed to load products");
        const data = (await res.json()) as {
          products: Array<{
            id: string;
            name: string;
            category: string;
            price: number;
            originalPrice?: number;
            stock: number;
            lowStockThreshold: number;
            active: boolean;
            badge?: string;
            description: string;
            fabric: string;
            care: string;
            images?: string[];
            colorOptions?: ColorOption[];
            colorImages?: ColorImage[];
          }>;
        };
        if (cancelled) return;
        const found = data.products.find((p) => p.id === product.id);
        if (!found) {
          throw new Error("Product not found");
        }
        setForm(hydrate(found));
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Could not load product."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, product]);

  // ---------- Field helpers ----------
  const setField = <K extends keyof EditForm>(key: K, value: EditForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // ---------- Color helpers ----------
  const addColor = () => {
    setForm((f) => {
      const next: ColorOption = { hex: "#888888", name: "New Color" };
      return {
        ...f,
        colors: [...f.colors, next],
        colorImages: { ...f.colorImages, [next.hex.toLowerCase()]: [] },
      };
    });
  };

  const removeColor = (idx: number) => {
    setForm((f) => {
      const c = f.colors[idx];
      if (!c) return f;
      const key = c.hex.toLowerCase();
      const nextColors = f.colors.filter((_, i) => i !== idx);
      const nextColorImages = { ...f.colorImages };
      delete nextColorImages[key];
      return { ...f, colors: nextColors, colorImages: nextColorImages };
    });
  };

  const updateColor = (idx: number, patch: Partial<ColorOption>) => {
    setForm((f) => {
      const cur = f.colors[idx];
      if (!cur) return f;
      const updated: ColorOption = { ...cur, ...patch };
      // If hex changed, remap the colorImages key.
      if (patch.hex && patch.hex.toLowerCase() !== cur.hex.toLowerCase()) {
        const oldKey = cur.hex.toLowerCase();
        const newKey = patch.hex.toLowerCase();
        const nextColorImages = { ...f.colorImages };
        const existing = nextColorImages[oldKey] ?? [];
        delete nextColorImages[oldKey];
        // Don't overwrite an existing entry for the new key — prefer merge.
        nextColorImages[newKey] = nextColorImages[newKey] ?? existing;
        const nextColors = [...f.colors];
        nextColors[idx] = updated;
        return { ...f, colors: nextColors, colorImages: nextColorImages };
      }
      const nextColors = [...f.colors];
      nextColors[idx] = updated;
      return { ...f, colors: nextColors };
    });
  };

  // ---------- Per-color image helpers ----------
  const colorUrls = (hex: string): string[] => form.colorImages[hex.toLowerCase()] ?? [];

  const setColorUrl = (hex: string, idx: number, url: string) => {
    setForm((f) => {
      const key = hex.toLowerCase();
      const list = [...(f.colorImages[key] ?? [])];
      list[idx] = url;
      return { ...f, colorImages: { ...f.colorImages, [key]: list } };
    });
  };

  const addColorUrl = (hex: string) => {
    setForm((f) => {
      const key = hex.toLowerCase();
      const list = [...(f.colorImages[key] ?? []), ""];
      return { ...f, colorImages: { ...f.colorImages, [key]: list } };
    });
  };

  const removeColorUrl = (hex: string, idx: number) => {
    setForm((f) => {
      const key = hex.toLowerCase();
      const list = (f.colorImages[key] ?? []).filter((_, i) => i !== idx);
      return { ...f, colorImages: { ...f.colorImages, [key]: list } };
    });
  };

  const moveColorUrl = (hex: string, idx: number, dir: -1 | 1) => {
    setForm((f) => {
      const key = hex.toLowerCase();
      const list = [...(f.colorImages[key] ?? [])];
      const target = idx + dir;
      if (target < 0 || target >= list.length) return f;
      [list[idx], list[target]] = [list[target], list[idx]];
      return { ...f, colorImages: { ...f.colorImages, [key]: list } };
    });
  };

  // ---------- Default gallery helpers ----------
  const setDefaultUrl = (idx: number, url: string) => {
    setForm((f) => {
      const next = [...f.images];
      next[idx] = url;
      return { ...f, images: next };
    });
  };
  const addDefaultUrl = () => {
    setForm((f) => ({ ...f, images: [...f.images, ""] }));
  };
  const removeDefaultUrl = (idx: number) => {
    setForm((f) => ({
      ...f,
      images: f.images.filter((_, i) => i !== idx),
    }));
  };
  const moveDefaultUrl = (idx: number, dir: -1 | 1) => {
    setForm((f) => {
      const next = [...f.images];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return f;
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...f, images: next };
    });
  };

  // ---------- Save ----------
  const onSave = async () => {
    if (!product) return;
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    // Build colorImages payload: for each color, collect non-empty URLs.
    // First URL → image, rest → images array. Only include colors with ≥1 URL.
    const colorImagesPayload = form.colors
      .map((c) => {
        const urls = (form.colorImages[c.hex.toLowerCase()] ?? [])
          .map((u) => u.trim())
          .filter((u) => u.length > 0);
        if (urls.length === 0) return null;
        return {
          colorHex: c.hex,
          colorName: c.name,
          image: urls[0],
          images: urls.slice(1),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    // Default gallery: filter empty URLs. The first becomes the product's
    // main `image` field for backwards compatibility with the API + card.
    const defaultImages = form.images
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (defaultImages.length === 0) {
      toast.error("At least one default gallery image is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category,
          price: Number(form.price) || 0,
          originalPrice: form.originalPrice
            ? Number(form.originalPrice)
            : null,
          badge: form.badge.trim() || null,
          stock: Number(form.stock) || 0,
          lowStockThreshold: Number(form.lowStockThreshold) || 5,
          description: form.description.trim(),
          fabric: form.fabric.trim(),
          care: form.care.trim(),
          active: Boolean(form.active),
          isNewArrival: Boolean(form.isNewArrival),
          isBestSeller: Boolean(form.isBestSeller),
          isFeatured: Boolean(form.isFeatured),
          colorOptions: form.colors,
          images: defaultImages,
          image: defaultImages[0],
          colorImages: colorImagesPayload,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to save product");
      }
      toast.success("Product updated", {
        description: `${form.name} — changes saved successfully.`,
      });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save product"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border bg-background p-0">
        <DialogTitle className="sr-only">
          Edit product — {product?.name}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Edit product details, colors, color-specific images and the default
          gallery.
        </DialogDescription>

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <Pencil className="size-5 flex-none text-[var(--gold)]" />
            <div className="min-w-0">
              <h2 className="font-serif text-lg font-medium">Edit Product</h2>
              <p className="truncate text-xs text-muted-foreground">
                {product?.name}
              </p>
            </div>
          </div>
          {form.active ? (
            <Badge className="bg-green-500/15 text-green-700">Active</Badge>
          ) : (
            <Badge className="bg-amber-500/15 text-amber-700">Inactive</Badge>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto elegant-scroll px-6 py-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm">Loading product…</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm">{loadError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 rounded-full"
                onClick={() => {
                  onOpenChange(false);
                  setTimeout(() => onOpenChange(true), 50);
                }}
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* -------- 1. Product Info -------- */}
              <section className="space-y-4">
                <SectionHeader
                  eyebrow="Step 1"
                  title="Product Information"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Label className="block sm:col-span-2">
                    <FieldLabel>
                      Product name <RequiredMark />
                    </FieldLabel>
                    <Input
                      value={form.name}
                      onChange={(e) => setField("name", e.target.value)}
                      placeholder="e.g. Noor Everyday Abaya"
                    />
                  </Label>

                  <Label className="block">
                    <FieldLabel>Category</FieldLabel>
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

                  <Label className="block">
                    <FieldLabel>Badge (optional)</FieldLabel>
                    <Input
                      value={form.badge}
                      onChange={(e) => setField("badge", e.target.value)}
                      placeholder="e.g. Just In, Best Seller"
                    />
                  </Label>

                  <Label className="block">
                    <FieldLabel>
                      Price (PKR) <RequiredMark />
                    </FieldLabel>
                    <Input
                      type="number"
                      value={form.price}
                      onChange={(e) => setField("price", e.target.value)}
                      placeholder="7400"
                      min={0}
                    />
                  </Label>

                  <Label className="block">
                    <FieldLabel>Original price (optional)</FieldLabel>
                    <Input
                      type="number"
                      value={form.originalPrice}
                      onChange={(e) => setField("originalPrice", e.target.value)}
                      placeholder="14500"
                      min={0}
                    />
                  </Label>

                  <Label className="block">
                    <FieldLabel>Stock quantity</FieldLabel>
                    <Input
                      type="number"
                      value={form.stock}
                      onChange={(e) => setField("stock", e.target.value)}
                      placeholder="50"
                      min={0}
                    />
                  </Label>

                  <Label className="block">
                    <FieldLabel>Low-stock threshold</FieldLabel>
                    <Input
                      type="number"
                      value={form.lowStockThreshold}
                      onChange={(e) =>
                        setField("lowStockThreshold", e.target.value)
                      }
                      placeholder="5"
                      min={0}
                    />
                  </Label>

                  <Label className="block sm:col-span-2">
                    <FieldLabel>Description</FieldLabel>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setField("description", e.target.value)}
                      placeholder="Describe the abaya's silhouette, details, and feel…"
                      rows={3}
                    />
                  </Label>

                  <Label className="block">
                    <FieldLabel>Fabric</FieldLabel>
                    <Input
                      value={form.fabric}
                      onChange={(e) => setField("fabric", e.target.value)}
                      placeholder="Premium matte crepe"
                    />
                  </Label>

                  <Label className="block">
                    <FieldLabel>Care instructions</FieldLabel>
                    <Input
                      value={form.care}
                      onChange={(e) => setField("care", e.target.value)}
                      placeholder="Dry clean recommended"
                    />
                  </Label>

                  <div className="flex items-center gap-3 sm:col-span-2">
                    <Switch
                      id="active-switch"
                      checked={form.active}
                      onCheckedChange={(checked) => setField("active", checked)}
                    />
                    <Label htmlFor="active-switch" className="cursor-pointer text-sm">
                      Active — visible to customers
                    </Label>
                  </div>

                  {/* Storefront section toggles — admin controls which
                      homepage sections a product appears in, independently
                      of its category. */}
                  <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="isNewArrival-switch"
                        checked={form.isNewArrival ?? false}
                        onCheckedChange={(checked) => setField("isNewArrival", checked)}
                      />
                      <Label htmlFor="isNewArrival-switch" className="cursor-pointer text-sm">
                        New Arrival
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="isBestSeller-switch"
                        checked={form.isBestSeller ?? false}
                        onCheckedChange={(checked) => setField("isBestSeller", checked)}
                      />
                      <Label htmlFor="isBestSeller-switch" className="cursor-pointer text-sm">
                        Best Seller
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="isFeatured-switch"
                        checked={form.isFeatured ?? false}
                        onCheckedChange={(checked) => setField("isFeatured", checked)}
                      />
                      <Label htmlFor="isFeatured-switch" className="cursor-pointer text-sm">
                        Featured (Daily Wear)
                      </Label>
                    </div>
                  </div>
                </div>
              </section>

              {/* -------- 2. Colors -------- */}
              <section className="space-y-4">
                <SectionHeader
                  eyebrow="Step 2"
                  title="Colors"
                  right={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addColor}
                      className="rounded-full"
                    >
                      <Plus className="size-4" /> Add Color
                    </Button>
                  }
                />
                {form.colors.length === 0 ? (
                  <div className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                    No colors defined. Click “Add Color” to create one.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {form.colors.map((c, idx) => {
                      const urlCount = colorUrls(c.hex).filter((u) => u.trim())
                        .length;
                      return (
                        <li
                          key={`${c.hex}-${idx}`}
                          className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2"
                        >
                          <span
                            className="size-7 flex-none rounded-full ring-1 ring-inset ring-black/10"
                            style={{ backgroundColor: c.hex }}
                            title={c.hex}
                          />
                          <Input
                            value={c.name}
                            onChange={(e) =>
                              updateColor(idx, { name: e.target.value })
                            }
                            placeholder="Color name"
                            className="h-8 w-40 text-xs"
                            aria-label="Color name"
                          />
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={c.hex}
                              onChange={(e) =>
                                updateColor(idx, { hex: e.target.value })
                              }
                              aria-label="Color picker"
                              className="size-8 cursor-pointer rounded-md border bg-background p-0.5"
                            />
                            <Input
                              value={c.hex}
                              onChange={(e) =>
                                updateColor(idx, { hex: e.target.value })
                              }
                              placeholder="#1a1a1a"
                              className="h-8 w-24 text-xs"
                              aria-label="Color hex"
                            />
                          </div>
                          <span className="ml-auto text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                            {urlCount} image{urlCount === 1 ? "" : "s"}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeColor(idx)}
                            className="inline-flex size-8 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
                            aria-label={`Remove ${c.name || "color"}`}
                            title="Remove color"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="rounded-md border border-dashed bg-secondary/30 px-3 py-2 text-[0.7rem] leading-relaxed text-muted-foreground">
                  Removing a color here also removes its color-specific images
                  on save. Editing a color's hex or name keeps its image list
                  attached (via hex key).
                </p>
              </section>

              {/* -------- 3. Color Images -------- */}
              <section className="space-y-4">
                <SectionHeader eyebrow="Step 3" title="Color Images" />
                {form.colors.length === 0 ? (
                  <div className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                    Add at least one color above to manage its images.
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {form.colors.map((c, idx) => {
                      const urls = colorUrls(c.hex);
                      return (
                        <li
                          key={`ci-${c.hex}-${idx}`}
                          className="rounded-lg border bg-card p-3"
                        >
                          <div className="flex items-center gap-2 border-b pb-2">
                            <span
                              className="size-5 flex-none rounded-full ring-1 ring-inset ring-black/10"
                              style={{ backgroundColor: c.hex }}
                              title={c.hex}
                            />
                            <span className="text-sm font-medium">
                              {c.name || "Untitled color"}
                            </span>
                            <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                              {c.hex}
                            </span>
                            <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                              {urls.filter((u) => u.trim()).length} image
                              {urls.filter((u) => u.trim()).length === 1
                                ? ""
                                : "s"}
                            </span>
                          </div>

                          {urls.length === 0 ? (
                            <div className="mt-3 flex items-center gap-2 rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">
                              <ImageIcon className="size-4" />
                              No images for this color. Customers will see the
                              default gallery.
                            </div>
                          ) : (
                            <ul className="mt-3 space-y-2">
                              {urls.map((url, uIdx) => (
                                <li
                                  key={`ci-url-${uIdx}`}
                                  className="flex items-center gap-2 rounded-md border bg-background p-2"
                                >
                                  <span className="relative size-10 flex-none overflow-hidden rounded-md border bg-secondary">
                                    {url.trim() ? (
                                      <img
                                        src={url.trim()}
                                        alt=""
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          (
                                            e.currentTarget as HTMLImageElement
                                          ).style.display = "none";
                                        }}
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                                        <ImageIcon className="size-4" />
                                      </div>
                                    )}
                                    {uIdx === 0 ? (
                                      <span
                                        className="absolute left-0 top-0 inline-flex items-center gap-0.5 rounded-br-md bg-[var(--gold)] px-1 py-0.5 text-[0.55rem] font-semibold text-black"
                                        title="Primary image for this color"
                                      >
                                        <Star className="size-2.5 fill-current" />
                                      </span>
                                    ) : null}
                                  </span>
                                  <div className="flex min-w-0 flex-1 items-center gap-1">
                                    <ImageUpload
                                      url={url}
                                      onChange={(newUrl) =>
                                        setColorUrl(c.hex, uIdx, newUrl)
                                      }
                                      label={`Image ${uIdx + 1} for ${c.name}`}
                                    />
                                  </div>
                                  <div className="flex flex-none items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => moveColorUrl(c.hex, uIdx, -1)}
                                      disabled={uIdx === 0}
                                      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary disabled:opacity-30"
                                      aria-label="Move up"
                                      title="Move up"
                                    >
                                      <ChevronUp className="size-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveColorUrl(c.hex, uIdx, 1)}
                                      disabled={uIdx === urls.length - 1}
                                      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary disabled:opacity-30"
                                      aria-label="Move down"
                                      title="Move down"
                                    >
                                      <ChevronDown className="size-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeColorUrl(c.hex, uIdx)}
                                      className="inline-flex size-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                                      aria-label="Remove image"
                                      title="Remove image"
                                    >
                                      <X className="size-4" />
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addColorUrl(c.hex)}
                            className="mt-2 rounded-full text-xs"
                          >
                            <Plus className="size-3.5" /> Add Image
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="rounded-md border border-dashed bg-secondary/30 px-3 py-2 text-[0.7rem] leading-relaxed text-muted-foreground">
                  The first image for each color is its primary/hero image;
                  additional URLs form the color's gallery. Colors with no
                  image URLs are dropped on save (customers see the default
                  gallery for them).
                </p>
              </section>

              {/* -------- 4. Default Gallery -------- */}
              <section className="space-y-4">
                <SectionHeader eyebrow="Step 4" title="Default Gallery" />
                <p className="-mt-1 text-xs text-muted-foreground">
                  Shown when no color is selected, or as a fallback. The first
                  image is the product's main <code className="rounded bg-secondary px-1 py-0.5 text-[0.65rem]">image</code> field.
                </p>
                {form.images.length === 0 ? (
                  <div className="rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">
                    <ImageIcon className="mb-1 size-4" />
                    No default images. At least one is required.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {form.images.map((url, idx) => (
                      <li
                        key={`dg-${idx}`}
                        className="flex items-center gap-2 rounded-md border bg-card p-2"
                      >
                        <span className="relative size-10 flex-none overflow-hidden rounded-md border bg-secondary">
                          {url.trim() ? (
                            <img
                              src={url.trim()}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                              <ImageIcon className="size-4" />
                            </div>
                          )}
                          {idx === 0 ? (
                            <span
                              className="absolute left-0 top-0 inline-flex items-center gap-0.5 rounded-br-md bg-[var(--gold)] px-1 py-0.5 text-[0.55rem] font-semibold text-black"
                              title="Primary product image"
                            >
                              <Star className="size-2.5 fill-current" />
                            </span>
                          ) : null}
                        </span>
                        <div className="flex min-w-0 flex-1 items-center gap-1">
                          <ImageUpload
                            url={url}
                            onChange={(newUrl) => setDefaultUrl(idx, newUrl)}
                            label={`Default gallery image ${idx + 1}`}
                          />
                        </div>
                        <div className="flex flex-none items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveDefaultUrl(idx, -1)}
                            disabled={idx === 0}
                            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary disabled:opacity-30"
                            aria-label="Move up"
                            title="Move up"
                          >
                            <ChevronUp className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDefaultUrl(idx, 1)}
                            disabled={idx === form.images.length - 1}
                            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary disabled:opacity-30"
                            aria-label="Move down"
                            title="Move down"
                          >
                            <ChevronDown className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDefaultUrl(idx)}
                            className="inline-flex size-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                            aria-label="Remove image"
                            title="Remove image"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDefaultUrl}
                  className="rounded-full"
                >
                  <Plus className="size-4" /> Add Image
                </Button>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={saving || loading || !!loadError}
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
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Small presentational helpers ---------- */

function SectionHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="eyebrow text-[var(--gold)]">{eyebrow}</span>
        <h3 className="mt-0.5 font-serif text-base font-medium">{title}</h3>
      </div>
      {right}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}

function RequiredMark() {
  return <span className="text-[var(--gold)]">*</span>;
}

export default AdminProductEditModal;
