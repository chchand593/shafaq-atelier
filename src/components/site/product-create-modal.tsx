"use client";

import * as React from "react";
import {
  Loader2,
  Plus,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  Star,
  Trash2,
  X,
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
import { cn } from "@/lib/utils";
import {
  ALL_SIZES,
  type ColorOption,
  type CombinationImage,
  type FabricOption,
  type StyleOption,
} from "@/lib/site-data";
import { ImageUpload } from "@/components/site/image-upload";
import { toast } from "sonner";

const CATEGORIES = ["Daily Wear", "New Arrivals", "Best Sellers"] as const;

/**
 * Slugify a name into a stable id (used for StyleOption.id / FabricOption.id).
 * E.g. "Pleated Sleeve" → "pleated-sleeve".
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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
  images: string[];
  badge: string;
  fabric: string;
  care: string;
  description: string;
  stock: string;
  lowStockThreshold: string;
  colors: ColorOption[];
  // Per-color image URLs keyed by lowercased hex. The first URL becomes the
  // color's primary `image`; the rest go into the `images` array.
  colorImages: Record<string, string[]>;
  sizes: string[];
  // Per-product Style + Fabric options and combination images (Color + Style
  // + Fabric → image). Empty arrays by default — additive, no breaking
  // change to existing products that have no styles/fabrics defined.
  styleOptions: StyleOption[];
  fabricOptions: FabricOption[];
  combinationImages: CombinationImage[];
  // Fix #7: Feature flags so admin can set them at creation time.
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
};

const EMPTY_FORM: ProductForm = {
  name: "",
  category: "Daily Wear",
  price: "",
  originalPrice: "",
  images: [],
  badge: "",
  fabric: "",
  care: "",
  description: "",
  stock: "50",
  lowStockThreshold: "5",
  colors: [{ hex: "#1a1a1a", name: "Black" }],
  colorImages: {},
  sizes: [...ALL_SIZES],
  styleOptions: [],
  fabricOptions: [],
  combinationImages: [],
  isNewArrival: false,
  isBestSeller: false,
  isFeatured: false,
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
  const [newImageUrl, setNewImageUrl] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setForm(EMPTY_FORM);
        setNewImageUrl("");
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const setField = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleColor = (c: ColorOption) => {
    setForm((f) => {
      const exists = f.colors.find((x) => x.hex === c.hex);
      if (exists) {
        // Removing — also drop any colorImages entry for that hex.
        const nextColorImages = { ...f.colorImages };
        delete nextColorImages[c.hex.toLowerCase()];
        return {
          ...f,
          colors: f.colors.filter((x) => x.hex !== c.hex),
          colorImages: nextColorImages,
        };
      }
      // Adding — init an empty URL list for that hex.
      return {
        ...f,
        colors: [...f.colors, c],
        colorImages: {
          ...f.colorImages,
          [c.hex.toLowerCase()]:
            f.colorImages[c.hex.toLowerCase()] ?? [],
        },
      };
    });
  };

  // Add a brand-new custom color with a default hex/name (editable inline).
  const addCustomColor = () => {
    setForm((f) => {
      const newColor: ColorOption = { hex: "#888888", name: "New Color" };
      return {
        ...f,
        colors: [...f.colors, newColor],
        colorImages: {
          ...f.colorImages,
          [newColor.hex.toLowerCase()]:
            f.colorImages[newColor.hex.toLowerCase()] ?? [],
        },
      };
    });
  };

  // Update an existing color (name or hex) by index. If hex changes, remap
  // the colorImages key so the image list follows the color.
  const updateColor = (idx: number, patch: Partial<ColorOption>) => {
    setForm((f) => {
      const cur = f.colors[idx];
      if (!cur) return f;
      const updated: ColorOption = { ...cur, ...patch };
      if (patch.hex && patch.hex.toLowerCase() !== cur.hex.toLowerCase()) {
        const oldKey = cur.hex.toLowerCase();
        const newKey = patch.hex.toLowerCase();
        const nextColorImages = { ...f.colorImages };
        const existing = nextColorImages[oldKey] ?? [];
        delete nextColorImages[oldKey];
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

  // Remove a color by index (also drops its colorImages entry).
  const removeColor = (idx: number) => {
    setForm((f) => {
      const c = f.colors[idx];
      if (!c) return f;
      const nextColorImages = { ...f.colorImages };
      delete nextColorImages[c.hex.toLowerCase()];
      return {
        ...f,
        colors: f.colors.filter((_, i) => i !== idx),
        colorImages: nextColorImages,
      };
    });
  };

  // ----- Per-color image helpers (keyed by lowercased hex) -----
  const colorUrls = (hex: string): string[] =>
    form.colorImages[hex.toLowerCase()] ?? [];

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

  const toggleSize = (s: string) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(s)
        ? f.sizes.filter((x) => x !== s)
        : [...f.sizes, s],
    }));
  };

  // ----- Image array helpers -----
  const addImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    setForm((f) => ({ ...f, images: [...f.images, url] }));
    setNewImageUrl("");
  };

  const removeImage = (idx: number) => {
    setForm((f) => ({
      ...f,
      images: f.images.filter((_, i) => i !== idx),
    }));
  };

  const moveImage = (idx: number, dir: -1 | 1) => {
    setForm((f) => {
      const next = [...f.images];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return f;
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...f, images: next };
    });
  };

  const makePrimary = (idx: number) => {
    setForm((f) => {
      const next = [...f.images];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return { ...f, images: next };
    });
  };

  // ---------- Style option helpers ----------
  // StyleOptions and FabricOptions are additive — empty arrays by default.
  // The id is a stable slug auto-derived from the name; the user can override
  // by typing a custom id directly. sortOrder is auto-assigned by array index.
  const addStyle = () => {
    setForm((f) => ({
      ...f,
      styleOptions: [
        ...f.styleOptions,
        {
          id: "",
          name: "",
          description: "",
          additionalPrice: 0,
          active: true,
          sortOrder: f.styleOptions.length,
        },
      ],
    }));
  };

  const removeStyle = (idx: number) => {
    setForm((f) => ({
      ...f,
      styleOptions: f.styleOptions
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, sortOrder: i })),
    }));
  };

  const updateStyle = (idx: number, patch: Partial<StyleOption>) => {
    setForm((f) => {
      const next = [...f.styleOptions];
      const cur = next[idx];
      if (!cur) return f;
      next[idx] = { ...cur, ...patch };
      return { ...f, styleOptions: next };
    });
  };

  // ---------- Fabric option helpers ----------
  // Mirror of Style — same shape, same edit pattern.
  const addFabric = () => {
    setForm((f) => ({
      ...f,
      fabricOptions: [
        ...f.fabricOptions,
        {
          id: "",
          name: "",
          description: "",
          additionalPrice: 0,
          active: true,
          sortOrder: f.fabricOptions.length,
        },
      ],
    }));
  };

  const removeFabric = (idx: number) => {
    setForm((f) => ({
      ...f,
      fabricOptions: f.fabricOptions
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, sortOrder: i })),
    }));
  };

  const updateFabric = (idx: number, patch: Partial<FabricOption>) => {
    setForm((f) => {
      const next = [...f.fabricOptions];
      const cur = next[idx];
      if (!cur) return f;
      next[idx] = { ...cur, ...patch };
      return { ...f, fabricOptions: next };
    });
  };

  // ---------- Combination image helpers ----------
  // Each entry pairs optional Color + Style + Fabric dimensions with one
  // primary image. Omitted dimensions match "Any" (all values). The `images`
  // array is sent as [] in the admin UI for now (single-image entries only).
  const addCombination = () => {
    setForm((f) => ({
      ...f,
      combinationImages: [
        ...f.combinationImages,
        {
          colorHex: undefined,
          styleId: undefined,
          fabricId: undefined,
          image: "",
          images: [],
        },
      ],
    }));
  };

  const removeCombination = (idx: number) => {
    setForm((f) => ({
      ...f,
      combinationImages: f.combinationImages.filter((_, i) => i !== idx),
    }));
  };

  const updateCombination = (idx: number, patch: Partial<CombinationImage>) => {
    setForm((f) => {
      const next = [...f.combinationImages];
      const cur = next[idx];
      if (!cur) return f;
      next[idx] = { ...cur, ...patch };
      return { ...f, combinationImages: next };
    });
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
    if (form.images.length === 0) {
      toast.error("At least one image is required");
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

      // Build style/fabric payloads: drop unnamed rows, auto-derive id from
      // name if the user hasn't typed one, re-index sortOrder.
      const styleOptionsPayload: StyleOption[] = form.styleOptions
        .filter((s) => s.name.trim() !== "")
        .map((s, i) => ({
          id: s.id.trim() || slugify(s.name.trim()),
          name: s.name.trim(),
          description: s.description?.trim() || undefined,
          additionalPrice: Number(s.additionalPrice) || 0,
          active: Boolean(s.active),
          sortOrder: i,
        }));

      const fabricOptionsPayload: FabricOption[] = form.fabricOptions
        .filter((s) => s.name.trim() !== "")
        .map((s, i) => ({
          id: s.id.trim() || slugify(s.name.trim()),
          name: s.name.trim(),
          description: s.description?.trim() || undefined,
          additionalPrice: Number(s.additionalPrice) || 0,
          active: Boolean(s.active),
          sortOrder: i,
        }));

      // Combination image payload — drop entries with no image URL. The
      // `images` array is sent empty for now (admin UI only manages a single
      // primary image per combination).
      const combinationImagesPayload: CombinationImage[] = form.combinationImages
        .filter((c) => c.image.trim() !== "")
        .map((c) => ({
          colorHex: c.colorHex || undefined,
          styleId: c.styleId || undefined,
          fabricId: c.fabricId || undefined,
          image: c.image.trim(),
          images: [],
        }));

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
          // Send both the array (new multi-image gallery) and a derived
          // primary `image` (first image) for backwards compatibility with
          // existing API validation and customer-facing list/card rendering.
          images: form.images,
          image: form.images[0],
          colorOptions: form.colors,
          colorImages: colorImagesPayload,
          sizes: form.sizes,
          // Per-product Style / Fabric options + combination images.
          styleOptions: styleOptionsPayload,
          fabricOptions: fabricOptionsPayload,
          combinationImages: combinationImagesPayload,
          badge: form.badge.trim() || undefined,
          fabric: form.fabric.trim(),
          care: form.care.trim(),
          description: form.description.trim(),
          stock: Number(form.stock) || 0,
          // Fix #7: Send feature flags so newly created products can appear
          // in New Arrivals / Best Sellers / Featured immediately.
          isNewArrival: form.isNewArrival,
          isBestSeller: form.isBestSeller,
          isFeatured: form.isFeatured,
          // Fix #16: Support lowStockThreshold on creation.
          lowStockThreshold: Number(form.lowStockThreshold) || 5,
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

            {/* Images (multi) */}
            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Product Images <span className="text-[var(--gold)]">*</span>{" "}
                <span className="text-muted-foreground/70">
                  ({form.images.length} added — first image is the primary/hero)
                </span>
              </span>

              {/* Existing image list */}
              {form.images.length > 0 ? (
                <ul className="mb-3 space-y-2">
                  {form.images.map((url, idx) => (
                    <li
                      key={`${url}-${idx}`}
                      className="flex items-center gap-3 rounded-md border bg-card p-2"
                    >
                      <span className="relative size-10 flex-none overflow-hidden rounded-md border bg-secondary">
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        {idx === 0 ? (
                          <span
                            className="absolute left-0 top-0 inline-flex items-center gap-0.5 rounded-br-md bg-[var(--gold)] px-1 py-0.5 text-[0.6rem] font-semibold text-black"
                            title="Primary image"
                          >
                            <Star className="size-2.5 fill-current" />
                          </span>
                        ) : null}
                      </span>

                      <div className="flex min-w-0 flex-1 items-center gap-1">
                        <ImageUpload
                          url={url}
                          onChange={(newUrl) => {
                            const next = [...form.images];
                            next[idx] = newUrl;
                            setField("images", next);
                          }}
                          label={`Image ${idx + 1}`}
                        />
                      </div>

                      <div className="flex flex-none items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveImage(idx, -1)}
                          disabled={idx === 0}
                          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary disabled:opacity-30"
                          aria-label="Move up"
                          title="Move up"
                        >
                          <ChevronUp className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(idx, 1)}
                          disabled={idx === form.images.length - 1}
                          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary disabled:opacity-30"
                          aria-label="Move down"
                          title="Move down"
                        >
                          <ChevronDown className="size-4" />
                        </button>
                        {idx !== 0 ? (
                          <button
                            type="button"
                            onClick={() => makePrimary(idx)}
                            className="inline-flex size-7 items-center justify-center rounded-md text-[var(--gold)] hover:bg-[var(--gold)]/10"
                            aria-label="Set as primary"
                            title="Set as primary"
                          >
                            <Star className="size-4" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="inline-flex size-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                          aria-label="Remove image"
                          title="Remove image"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mb-3 flex items-center gap-2 rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">
                  <ImageIcon className="size-4" />
                  No images added yet. Add at least one image URL below.
                </div>
              )}

              {/* Add new image URL */}
              <div className="flex gap-2">
                <Input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addImage();
                    }
                  }}
                  placeholder="/images/my-abaya.jpg"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addImage}
                  disabled={!newImageUrl.trim()}
                  className="rounded-full"
                >
                  <Plus className="size-4" /> Add
                </Button>
              </div>
            </div>

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
                Colours ({form.colors.length} selected){" "}
                <span className="text-muted-foreground/70">
                  — click a preset to toggle, or add a custom colour below
                </span>
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

              {/* Editable list of currently-selected colours (incl. custom) */}
              {form.colors.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {form.colors.map((c, idx) => {
                    const urlCount = colorUrls(c.hex).filter((u) => u.trim())
                      .length;
                    const isPreset = COLOR_PRESETS.some(
                      (p) => p.hex.toLowerCase() === c.hex.toLowerCase()
                    );
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
                          aria-label={`Color ${idx + 1} name`}
                        />
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={c.hex}
                            onChange={(e) =>
                              updateColor(idx, { hex: e.target.value })
                            }
                            aria-label={`Color ${idx + 1} picker`}
                            className="size-8 cursor-pointer rounded-md border bg-background p-0.5"
                          />
                          <Input
                            value={c.hex}
                            onChange={(e) =>
                              updateColor(idx, { hex: e.target.value })
                            }
                            placeholder="#1a1a1a"
                            className="h-8 w-24 text-xs"
                            aria-label={`Color ${idx + 1} hex`}
                          />
                        </div>
                        <span className="ml-auto text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                          {urlCount} image{urlCount === 1 ? "" : "s"}
                        </span>
                        {isPreset ? (
                          <button
                            type="button"
                            onClick={() => toggleColor(c)}
                            className="inline-flex size-8 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
                            aria-label={`Remove ${c.name || "color"}`}
                            title="Remove colour"
                          >
                            <X className="size-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => removeColor(idx)}
                            className="inline-flex size-8 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
                            aria-label={`Remove ${c.name || "color"}`}
                            title="Remove colour"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomColor}
                className="mt-3 rounded-full"
              >
                <Plus className="size-4" /> Add Custom Colour
              </Button>
            </div>

            {/* Colour Images — per-color URL management */}
            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Colour Images{" "}
                <span className="text-muted-foreground/70">
                  (optional — first image per colour is its primary/hero)
                </span>
              </span>
              {form.colors.length === 0 ? (
                <div className="rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">
                  <ImageIcon className="mb-1 size-4" />
                  Select at least one colour above to manage its images.
                </div>
              ) : (
                <ul className="space-y-3">
                  {form.colors.map((c, idx) => {
                    const urls = colorUrls(c.hex);
                    const nonEmpty = urls.filter((u) => u.trim());
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
                            {c.name || "Untitled colour"}
                          </span>
                          <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                            {c.hex}
                          </span>
                          <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                            {nonEmpty.length} image
                            {nonEmpty.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        {urls.length === 0 ? (
                          <div className="mt-3 flex items-center gap-2 rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">
                            <ImageIcon className="size-4" />
                            No images for this colour — customers will see the
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
                                      title="Primary image for this colour"
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
              <p className="mt-3 rounded-md border border-dashed bg-secondary/30 px-3 py-2 text-[0.7rem] leading-relaxed text-muted-foreground">
                The first image for each colour is its primary/hero image;
                additional URLs form the colour's gallery. Colours with no image
                URLs are dropped on save (customers see the default gallery for
                them).
              </p>
            </div>

            {/* Styles — per-product Style options (additive, optional) */}
            <div className="sm:col-span-2">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span className="block text-xs font-medium text-muted-foreground">
                  Styles{" "}
                  <span className="text-muted-foreground/70">
                    (optional — e.g. Pleated, Open Front, Bell Sleeve)
                  </span>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStyle}
                  className="rounded-full"
                >
                  <Plus className="size-4" /> Add Style
                </Button>
              </div>
              {form.styleOptions.length === 0 ? (
                <div className="rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">
                  No styles defined. Customers will see the default variant
                  only.
                </div>
              ) : (
                <ul className="space-y-2">
                  {form.styleOptions.map((s, idx) => (
                    <li
                      key={`st-${idx}-${s.id || "new"}`}
                      className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2"
                    >
                      <Input
                        value={s.name}
                        onChange={(e) =>
                          updateStyle(idx, { name: e.target.value })
                        }
                        onBlur={(e) => {
                          const trimmed = e.target.value.trim();
                          if (trimmed && !s.id) {
                            updateStyle(idx, { id: slugify(trimmed) });
                          }
                        }}
                        placeholder="Style name (e.g. Pleated)"
                        className="h-8 w-44 text-xs"
                        aria-label={`Style ${idx + 1} name`}
                      />
                      <Input
                        value={s.id}
                        onChange={(e) =>
                          updateStyle(idx, { id: e.target.value })
                        }
                        placeholder="auto-slug"
                        className="h-8 w-28 text-xs"
                        aria-label={`Style ${idx + 1} id (slug)`}
                        title="Stable id — auto-derived from the name; override only if you need a custom slug."
                      />
                      <Input
                        type="number"
                        value={String(s.additionalPrice)}
                        onChange={(e) =>
                          updateStyle(idx, {
                            additionalPrice: Number(e.target.value) || 0,
                          })
                        }
                        placeholder="0"
                        min={0}
                        className="h-8 w-24 text-xs"
                        aria-label={`Style ${idx + 1} additional price`}
                      />
                      <Input
                        value={s.description ?? ""}
                        onChange={(e) =>
                          updateStyle(idx, { description: e.target.value })
                        }
                        placeholder="Short description (optional)"
                        className="h-8 w-48 text-xs"
                        aria-label={`Style ${idx + 1} description`}
                      />
                      <div className="flex items-center gap-1.5">
                        <Switch
                          checked={s.active}
                          onCheckedChange={(checked) =>
                            updateStyle(idx, { active: checked })
                          }
                          aria-label={`Style ${idx + 1} active toggle`}
                        />
                        <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                          {s.active ? "Active" : "Off"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStyle(idx)}
                        className="ml-auto inline-flex size-8 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
                        aria-label={`Remove ${s.name || "style"}`}
                        title="Remove style"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 rounded-md border border-dashed bg-secondary/30 px-3 py-2 text-[0.7rem] leading-relaxed text-muted-foreground">
                The id is a stable slug auto-derived from the name — edit it
                only if you need a custom id. The additional price is added to
                the base price server-side when this style is selected.
                Empty/unnamed rows are dropped on save.
              </p>
            </div>

            {/* Fabrics — per-product Fabric options (additive, optional) */}
            <div className="sm:col-span-2">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span className="block text-xs font-medium text-muted-foreground">
                  Fabrics{" "}
                  <span className="text-muted-foreground/70">
                    (optional — e.g. Nida, Silk, Chiffon)
                  </span>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFabric}
                  className="rounded-full"
                >
                  <Plus className="size-4" /> Add Fabric
                </Button>
              </div>
              {form.fabricOptions.length === 0 ? (
                <div className="rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">
                  No fabrics defined. Customers will see the default variant
                  only.
                </div>
              ) : (
                <ul className="space-y-2">
                  {form.fabricOptions.map((s, idx) => (
                    <li
                      key={`fb-${idx}-${s.id || "new"}`}
                      className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2"
                    >
                      <Input
                        value={s.name}
                        onChange={(e) =>
                          updateFabric(idx, { name: e.target.value })
                        }
                        onBlur={(e) => {
                          const trimmed = e.target.value.trim();
                          if (trimmed && !s.id) {
                            updateFabric(idx, { id: slugify(trimmed) });
                          }
                        }}
                        placeholder="Fabric name (e.g. Nida)"
                        className="h-8 w-44 text-xs"
                        aria-label={`Fabric ${idx + 1} name`}
                      />
                      <Input
                        value={s.id}
                        onChange={(e) =>
                          updateFabric(idx, { id: e.target.value })
                        }
                        placeholder="auto-slug"
                        className="h-8 w-28 text-xs"
                        aria-label={`Fabric ${idx + 1} id (slug)`}
                        title="Stable id — auto-derived from the name; override only if you need a custom slug."
                      />
                      <Input
                        type="number"
                        value={String(s.additionalPrice)}
                        onChange={(e) =>
                          updateFabric(idx, {
                            additionalPrice: Number(e.target.value) || 0,
                          })
                        }
                        placeholder="0"
                        min={0}
                        className="h-8 w-24 text-xs"
                        aria-label={`Fabric ${idx + 1} additional price`}
                      />
                      <Input
                        value={s.description ?? ""}
                        onChange={(e) =>
                          updateFabric(idx, { description: e.target.value })
                        }
                        placeholder="Short description (optional)"
                        className="h-8 w-48 text-xs"
                        aria-label={`Fabric ${idx + 1} description`}
                      />
                      <div className="flex items-center gap-1.5">
                        <Switch
                          checked={s.active}
                          onCheckedChange={(checked) =>
                            updateFabric(idx, { active: checked })
                          }
                          aria-label={`Fabric ${idx + 1} active toggle`}
                        />
                        <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                          {s.active ? "Active" : "Off"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFabric(idx)}
                        className="ml-auto inline-flex size-8 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
                        aria-label={`Remove ${s.name || "fabric"}`}
                        title="Remove fabric"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 rounded-md border border-dashed bg-secondary/30 px-3 py-2 text-[0.7rem] leading-relaxed text-muted-foreground">
                Fabrics are optional material variants. Same id/price/active
                model as Styles. Empty/unnamed rows are dropped on save.
              </p>
            </div>

            {/* Combination Images — Color + Style + Fabric → image */}
            <div className="sm:col-span-2">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span className="block text-xs font-medium text-muted-foreground">
                  Combination Images (Color + Style + Fabric){" "}
                  <span className="text-muted-foreground/70">
                    (optional — assign a specific image to a combination)
                  </span>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCombination}
                  className="rounded-full"
                >
                  <Plus className="size-4" /> Add Combination
                </Button>
              </div>
              <p className="-mt-0.5 mb-2 text-xs text-muted-foreground">
                Leave any dimension as “Any” to match all values of that
                dimension. The customer gallery falls back through exact
                match → color+style → color → style → default gallery when
                no exact match is found.
              </p>
              {form.combinationImages.length === 0 ? (
                <div className="rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">
                  No combination images defined. Customers will see the
                  default gallery fallback chain.
                </div>
              ) : (
                <ul className="space-y-3">
                  {form.combinationImages.map((c, idx) => (
                    <li
                      key={`comb-${idx}`}
                      className="flex flex-wrap items-start gap-3 rounded-lg border bg-card p-3"
                    >
                      {/* Color dropdown */}
                      <div className="flex w-36 flex-col gap-1">
                        <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                          Color
                        </span>
                        <select
                          value={c.colorHex ?? ""}
                          onChange={(e) =>
                            updateCombination(idx, {
                              colorHex: e.target.value || undefined,
                            })
                          }
                          className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          aria-label={`Combination ${idx + 1} color`}
                        >
                          <option value="">Any color</option>
                          {form.colors.map((col) => (
                            <option key={col.hex} value={col.hex}>
                              {col.name || col.hex}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Style dropdown — only shown when styles exist */}
                      {form.styleOptions.length > 0 ? (
                        <div className="flex w-36 flex-col gap-1">
                          <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                            Style
                          </span>
                          <select
                            value={c.styleId ?? ""}
                            onChange={(e) =>
                              updateCombination(idx, {
                                styleId: e.target.value || undefined,
                              })
                            }
                            className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            aria-label={`Combination ${idx + 1} style`}
                          >
                            <option value="">Any style</option>
                            {form.styleOptions.map((s) => (
                              <option key={s.id || s.name} value={s.id}>
                                {s.name || s.id}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="flex w-36 flex-col gap-1">
                          <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                            Style
                          </span>
                          <span className="flex h-9 items-center rounded-md border border-dashed px-2 text-[0.7rem] italic text-muted-foreground/70">
                            Add styles first
                          </span>
                        </div>
                      )}

                      {/* Fabric dropdown — only shown when fabrics exist */}
                      {form.fabricOptions.length > 0 ? (
                        <div className="flex w-36 flex-col gap-1">
                          <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                            Fabric
                          </span>
                          <select
                            value={c.fabricId ?? ""}
                            onChange={(e) =>
                              updateCombination(idx, {
                                fabricId: e.target.value || undefined,
                              })
                            }
                            className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            aria-label={`Combination ${idx + 1} fabric`}
                          >
                            <option value="">Any fabric</option>
                            {form.fabricOptions.map((s) => (
                              <option key={s.id || s.name} value={s.id}>
                                {s.name || s.id}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="flex w-36 flex-col gap-1">
                          <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                            Fabric
                          </span>
                          <span className="flex h-9 items-center rounded-md border border-dashed px-2 text-[0.7rem] italic text-muted-foreground/70">
                            Add fabrics first
                          </span>
                        </div>
                      )}

                      {/* Image upload */}
                      <div className="flex min-w-[220px] flex-1 flex-col gap-1">
                        <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                          Image
                        </span>
                        <ImageUpload
                          url={c.image}
                          onChange={(newUrl) =>
                            updateCombination(idx, { image: newUrl })
                          }
                          label={`Combination ${idx + 1} image`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeCombination(idx)}
                        className="mt-[1.4rem] inline-flex size-8 flex-none items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
                        aria-label="Remove combination"
                        title="Remove combination"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 rounded-md border border-dashed bg-secondary/30 px-3 py-2 text-[0.7rem] leading-relaxed text-muted-foreground">
                Entries with no image URL are dropped on save. The admin UI
                only manages a single primary image per combination; the
                optional <code className="rounded bg-secondary px-1 py-0.5 text-[0.65rem]">images</code> array is
                sent as an empty list.
              </p>
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
