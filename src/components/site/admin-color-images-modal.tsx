"use client";

import * as React from "react";
import {
  Loader2,
  Image as ImageIcon,
  X,
  Save,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ColorImage, ColorOption } from "@/lib/site-data";
import { toast } from "sonner";

/**
 * Admin modal for managing color-specific product images on an existing
 * product. On open it fetches the product's current `colorImages` payload
 * from `/api/admin/products` (matched by slug), lets the admin paste an
 * image URL per color (with live preview), and saves via
 * `PATCH /api/admin/products/[slug]` — sending only entries where the
 * image URL is non-empty. No other product fields are touched.
 */
export function AdminColorImagesModal({
  productSlug,
  productName,
  colorOptions,
  open,
  onOpenChange,
  onSaved,
}: {
  productSlug: string;
  productName: string;
  colorOptions: ColorOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  // `entries` maps each color hex → its current image URL string (may be "").
  const [entries, setEntries] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Reset internal state whenever the modal closes so the next open starts fresh.
  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setEntries({});
        setLoadError(null);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Fetch the product's current colorImages whenever the modal opens.
  React.useEffect(() => {
    if (!open || !productSlug) return;
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
            colorImages?: ColorImage[];
          }>;
        };
        if (cancelled) return;
        const found = data.products.find((p) => p.id === productSlug);
        const next: Record<string, string> = {};
        for (const ci of found?.colorImages ?? []) {
          next[ci.colorHex.toLowerCase()] = ci.image || "";
        }
        setEntries(next);
      } catch {
        if (!cancelled) {
          setLoadError("Could not load existing color images.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, productSlug]);

  const setUrl = (hex: string, url: string) => {
    setEntries((prev) => ({ ...prev, [hex.toLowerCase()]: url }));
  };

  const clearUrl = (hex: string) => {
    setEntries((prev) => {
      const next = { ...prev };
      delete next[hex.toLowerCase()];
      return next;
    });
  };

  const onSave = async () => {
    // Build the colorImages array: only entries where the URL is non-empty
    // (after trimming) are included. Each entry preserves the color's hex
    // and display name from `colorOptions`.
    const payload: ColorImage[] = colorOptions
      .map((c) => {
        const url = (entries[c.hex.toLowerCase()] || "").trim();
        if (!url) return null;
        return {
          colorHex: c.hex,
          colorName: c.name,
          image: url,
        };
      })
      .filter((x): x is ColorImage => x !== null);

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${productSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colorImages: payload }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to save color images");
      }
      toast.success("Color images saved", {
        description:
          payload.length === 0
            ? `${productName}: all color images cleared.`
            : `${productName}: ${payload.length} color image${
                payload.length === 1 ? "" : "s"
              } updated.`,
      });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save color images"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border bg-background p-0">
        <DialogTitle className="sr-only">
          Manage color images — {productName}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Paste an image URL for each available color. Customers will see the
          matching image when they select that color.
        </DialogDescription>

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <ImageIcon className="size-5 flex-none text-[var(--gold)]" />
            <div className="min-w-0">
              <h2 className="font-serif text-lg font-medium">Color Images</h2>
              <p className="truncate text-xs text-muted-foreground">
                {productName}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
            {colorOptions.length} color{colorOptions.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto elegant-scroll px-6 py-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm">Loading existing color images…</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm">{loadError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 rounded-full"
                onClick={() => {
                  // Trigger re-fetch by toggling open state.
                  onOpenChange(false);
                  setTimeout(() => onOpenChange(true), 50);
                }}
              >
                Retry
              </Button>
            </div>
          ) : colorOptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <ImageIcon className="size-8 opacity-40" />
              <p className="text-sm">
                This product has no colors defined. Add colors via the product
                create flow first.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {colorOptions.map((c) => {
                const hex = c.hex.toLowerCase();
                const url = entries[hex] || "";
                return (
                  <li
                    key={c.hex}
                    className="rounded-lg border bg-card p-3"
                  >
                    {/* Color header row */}
                    <div className="flex items-center gap-2">
                      <span
                        className="size-5 flex-none rounded-full ring-1 ring-inset ring-black/10"
                        style={{ backgroundColor: c.hex }}
                        title={c.hex}
                      />
                      <span className="text-sm font-medium">{c.name}</span>
                      <span className="ml-auto text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                        {c.hex}
                      </span>
                    </div>

                    {/* Image URL input + preview */}
                    <div className="mt-3 flex items-start gap-3">
                      {/* Thumbnail / live preview */}
                      <div className="relative size-16 flex-none overflow-hidden rounded-md border bg-secondary">
                        {url.trim() ? (
                          <img
                            src={url.trim()}
                            alt={`${c.name} preview`}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              // Hide broken images so the placeholder shows.
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                            <ImageIcon className="size-5" />
                          </div>
                        )}
                      </div>

                      {/* URL input + clear */}
                      <div className="flex-1 space-y-1.5">
                        <Label htmlFor={`ci-${hex}`} className="sr-only">
                          {c.name} image URL
                        </Label>
                        <Input
                          id={`ci-${hex}`}
                          value={url}
                          onChange={(e) => setUrl(hex, e.target.value)}
                          placeholder="/images/color-variant.jpg"
                          className="h-9 text-sm"
                        />
                        <div className="flex items-center justify-between">
                          <p className="text-[0.7rem] text-muted-foreground">
                            {url.trim()
                              ? "Live preview updates as you type."
                              : "No image set — customers see the default product image."}
                          </p>
                          {url.trim() ? (
                            <button
                              type="button"
                              onClick={() => clearUrl(hex)}
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-medium text-destructive transition-colors hover:bg-destructive/10"
                            >
                              <X className="size-3" /> Remove
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {!loading && !loadError && colorOptions.length > 0 ? (
            <p className="mt-4 rounded-md border border-dashed bg-secondary/30 px-3 py-2 text-[0.7rem] leading-relaxed text-muted-foreground">
              Only colors with a non-empty image URL will be saved. Empty
              entries are dropped automatically. This action does not modify any
              other product field.
            </p>
          ) : null}
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
                <Save className="size-4" /> Save
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AdminColorImagesModal;
