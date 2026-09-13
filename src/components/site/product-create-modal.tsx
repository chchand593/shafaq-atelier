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
import { cn } from "@/lib/utils";
import { ALL_SIZES, type ColorOption } from "@/lib/site-data";
import { ImageUpload } from "@/components/site/image-upload";
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
  images: string[];
  badge: string;
  fabric: string;
  care: string;
  description: string;
  stock: string;
  colors: ColorOption[];
  // Per-color image URLs keyed by lowercased hex. The first URL becomes the
  // color's primary `image`; the rest go into the `images` array.
  colorImages: Record<string, string[]>;
  sizes: string[];
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
  colors: [{ hex: "#1a1a1a", name: "Black" }],
  colorImages: {},
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
