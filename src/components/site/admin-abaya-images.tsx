"use client";

import * as React from "react";
import {
  Images,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Star,
  Power,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AbayaImage = {
  id: string;
  abayaStyleId: string;
  url: string;
  angle: string; // front | back | left | right | detail
  label: string;
  isPrimary: boolean;
  colorHex: string | null;
  sortOrder: number;
};

type AbayaStyle = {
  id: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  sortOrder: number;
  images: AbayaImage[];
};

const ANGLES: Array<{ value: string; label: string }> = [
  { value: "front", label: "Front" },
  { value: "back", label: "Back" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "detail", label: "Detail" },
];

const MIN_IMAGES = 3;

export function AdminAbayaImages() {
  const [styles, setStyles] = React.useState<AbayaStyle[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Add-image form state
  const [newUrl, setNewUrl] = React.useState("");
  const [newAngle, setNewAngle] = React.useState("front");
  const [adding, setAdding] = React.useState(false);

  // Style edit state — local buffer for name/description so we can PATCH on blur.
  const [styleDraft, setStyleDraft] = React.useState<{
    name: string;
    description: string;
  } | null>(null);
  const [savingStyle, setSavingStyle] = React.useState(false);
  const [togglingStyle, setTogglingStyle] = React.useState(false);

  // Image card delete confirmation
  const [deleteTarget, setDeleteTarget] = React.useState<AbayaImage | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Per-image in-flight action tracking (for spinner on buttons).
  const [busyImage, setBusyImage] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/abaya-styles", { cache: "no-store" });
      const d = (await res.json()) as { styles?: AbayaStyle[] };
      const list = d.styles || [];
      setStyles(list);
      // Auto-select the first style if nothing is selected yet.
      setSelectedId((prev) => {
        if (prev && list.some((s) => s.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch {
      toast.error("Failed to load abaya styles");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const selected = React.useMemo(
    () => styles.find((s) => s.id === selectedId) ?? null,
    [styles, selectedId]
  );

  // Keep styleDraft in sync with the currently selected style.
  React.useEffect(() => {
    if (!selected) {
      setStyleDraft(null);
      return;
    }
    setStyleDraft({ name: selected.name, description: selected.description });
  }, [selected?.id]);

  // ---- Style-level actions ---------------------------------------------------

  const patchStyle = async (id: string, patch: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/abaya-styles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const d = (await res.json()) as { ok?: boolean; error?: string; style?: AbayaStyle };
    if (!res.ok || !d.ok) {
      throw new Error(d.error || "Failed to update style");
    }
    return d.style;
  };

  const saveStyleField = async (field: "name" | "description") => {
    if (!selected || !styleDraft) return;
    const value = styleDraft[field];
    if (value === (field === "name" ? selected.name : selected.description)) return;
    if (field === "name" && value.trim().length === 0) {
      toast.error("Style name cannot be empty");
      setStyleDraft({ ...styleDraft, name: selected.name });
      return;
    }
    setSavingStyle(true);
    try {
      await patchStyle(selected.id, { [field]: value });
      toast.success("Style updated", { description: field === "name" ? value : undefined });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update style");
      // Revert local draft to server value on failure.
      setStyleDraft({
        name: selected.name,
        description: selected.description,
      });
    } finally {
      setSavingStyle(false);
    }
  };

  const toggleActive = async () => {
    if (!selected) return;
    setTogglingStyle(true);
    try {
      await patchStyle(selected.id, { active: !selected.active });
      toast.success(!selected.active ? "Style activated" : "Style deactivated", {
        description: `${selected.name} is now ${!selected.active ? "visible" : "hidden"} from customers.`,
      });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle style");
    } finally {
      setTogglingStyle(false);
    }
  };

  // ---- Image-level actions ---------------------------------------------------

  const patchImage = async (id: string, patch: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/abaya-images/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const d = (await res.json()) as { ok?: boolean; error?: string; image?: AbayaImage };
    if (!res.ok || !d.ok) {
      throw new Error(d.error || "Failed to update image");
    }
    return d.image;
  };

  const addImage = async () => {
    if (!selected) return;
    const url = newUrl.trim();
    if (!url) {
      toast.error("Image URL is required");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/abaya-styles/${selected.id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, angle: newAngle }),
      });
      const d = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !d.ok) {
        throw new Error(d.error || "Failed to add image");
      }
      toast.success("Image added");
      setNewUrl("");
      setNewAngle("front");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add image");
    } finally {
      setAdding(false);
    }
  };

  const setPrimary = async (img: AbayaImage) => {
    if (img.isPrimary) return;
    setBusyImage(img.id);
    try {
      await patchImage(img.id, { isPrimary: true });
      toast.success("Set as primary");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to set primary");
    } finally {
      setBusyImage(null);
    }
  };

  const updateAngle = async (img: AbayaImage, angle: string) => {
    setBusyImage(img.id);
    try {
      await patchImage(img.id, { angle });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update angle");
    } finally {
      setBusyImage(null);
    }
  };

  const updateLabel = async (img: AbayaImage, label: string) => {
    if (label === img.label) return;
    setBusyImage(img.id);
    try {
      await patchImage(img.id, { label });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update label");
    } finally {
      setBusyImage(null);
    }
  };

  const updateColorHex = async (img: AbayaImage, colorHex: string) => {
    const next = colorHex.trim();
    const current = img.colorHex ?? "";
    if (next === current) return;
    setBusyImage(img.id);
    try {
      await patchImage(img.id, { colorHex: next || null });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update color");
    } finally {
      setBusyImage(null);
    }
  };

  const moveImage = async (img: AbayaImage, direction: -1 | 1) => {
    if (!selected) return;
    const imgs = [...selected.images].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = imgs.findIndex((i) => i.id === img.id);
    const targetIdx = idx + direction;
    if (idx < 0 || targetIdx < 0 || targetIdx >= imgs.length) return;
    const target = imgs[targetIdx];
    setBusyImage(img.id);
    try {
      // Swap sortOrder values between the moved image and its neighbour.
      await Promise.all([
        patchImage(img.id, { sortOrder: target.sortOrder }),
        patchImage(target.id, { sortOrder: img.sortOrder }),
      ]);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reorder");
    } finally {
      setBusyImage(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/abaya-images/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const d = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !d.ok) {
        throw new Error(d.error || "Failed to delete image");
      }
      toast.success("Image deleted");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete image");
    } finally {
      setDeleting(false);
    }
  };

  // ---- Render ----------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow text-[var(--gold)]">Preview System</span>
          <h1 className="mt-1 font-serif text-2xl font-medium sm:text-3xl">
            Abaya Image Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the preview gallery for each abaya style. Add multiple angles,
            mark a hero image, and optionally link images to colors.
          </p>
        </div>
      </div>

      {styles.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed py-16 text-center">
          <Images className="mx-auto size-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">No abaya styles found.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create styles in the Add-ons page first.
          </p>
        </div>
      ) : (
        <>
          {/* Style selector */}
          <div className="mt-6 max-w-md">
            <Label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Select abaya style
              </span>
              <Select
                value={selectedId ?? undefined}
                onValueChange={(v) => setSelectedId(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a style…" />
                </SelectTrigger>
                <SelectContent>
                  {styles.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        {s.name}
                        <span className="text-xs text-muted-foreground">
                          ({s.images.length})
                        </span>
                        {!s.active ? (
                          <Badge variant="secondary" className="ml-1 text-[0.6rem]">
                            inactive
                          </Badge>
                        ) : null}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Label>
          </div>

          {selected ? (
            <div className="mt-6 space-y-6">
              {/* Style info card */}
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                          Style name
                        </span>
                        <Input
                          value={styleDraft?.name ?? ""}
                          onChange={(e) =>
                            setStyleDraft((d) =>
                              d ? { ...d, name: e.target.value } : d
                            )
                          }
                          onBlur={() => void saveStyleField("name")}
                          disabled={savingStyle}
                        />
                      </Label>
                      <Label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                          Slug (read-only)
                        </span>
                        <Input value={selected.slug} readOnly disabled />
                      </Label>
                    </div>
                    <Label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        Description
                      </span>
                      <Input
                        value={styleDraft?.description ?? ""}
                        onChange={(e) =>
                          setStyleDraft((d) =>
                            d ? { ...d, description: e.target.value } : d
                          )
                        }
                        onBlur={() => void saveStyleField("description")}
                        disabled={savingStyle}
                        placeholder="Short marketing line for this silhouette"
                      />
                    </Label>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        Sort:{" "}
                        <span className="font-medium text-foreground">
                          {selected.sortOrder}
                        </span>
                      </span>
                      <span>
                        Images:{" "}
                        <span className="font-medium text-foreground">
                          {selected.images.length}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start rounded-full border bg-background px-3 py-2">
                    <Switch
                      checked={selected.active}
                      onCheckedChange={() => void toggleActive()}
                      disabled={togglingStyle}
                      id="style-active"
                    />
                    <Label
                      htmlFor="style-active"
                      className="flex items-center gap-1.5 text-xs font-medium"
                    >
                      <Power className="size-3" />
                      {togglingStyle ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : selected.active ? (
                        "Active"
                      ) : (
                        "Inactive"
                      )}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Count summary + warning */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Badge variant="secondary" className="rounded-full">
                  {selected.images.length} image
                  {selected.images.length === 1 ? "" : "s"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  (minimum {MIN_IMAGES} recommended)
                </span>
                {selected.images.length < MIN_IMAGES ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-700">
                    <AlertTriangle className="size-3.5" />
                    At least {MIN_IMAGES} images recommended for this style
                  </span>
                ) : null}
              </div>

              {/* Image grid + add-image card */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[...selected.images]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((img, idx, arr) => (
                    <ImageCard
                      key={img.id}
                      image={img}
                      busy={busyImage === img.id}
                      canMoveUp={idx > 0}
                      canMoveDown={idx < arr.length - 1}
                      onSetPrimary={() => void setPrimary(img)}
                      onAngleChange={(a) => void updateAngle(img, a)}
                      onLabelCommit={(l) => void updateLabel(img, l)}
                      onColorHexCommit={(c) => void updateColorHex(img, c)}
                      onMoveUp={() => void moveImage(img, -1)}
                      onMoveDown={() => void moveImage(img, 1)}
                      onDelete={() => setDeleteTarget(img)}
                    />
                  ))}

                {/* Add image card */}
                <div className="flex min-h-[260px] flex-col items-stretch justify-between rounded-xl border border-dashed bg-card/50 p-5">
                  <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
                    <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
                      <Plus className="size-6" />
                    </div>
                    <p className="mt-2 text-sm font-medium">Add an image</p>
                    <p className="mt-1 text-xs">
                      Paste a URL to a hosted image. The preview updates live.
                    </p>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Input
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://…/abaya-front.jpg"
                    />
                    <Select value={newAngle} onValueChange={setNewAngle}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ANGLES.map((a) => (
                          <SelectItem key={a.value} value={a.value}>
                            {a.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={() => void addImage()}
                      disabled={adding || !newUrl.trim()}
                      className="w-full rounded-full"
                    >
                      {adding ? (
                        <>
                          <Loader2 className="size-4 animate-spin" /> Adding…
                        </>
                      ) : (
                        <>
                          <Plus className="size-4" /> Add Image
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Delete confirmation */}
      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-sm rounded-xl border bg-card p-6 text-center shadow-lg">
            <AlertTriangle className="mx-auto size-10 text-destructive" />
            <h3 className="mt-3 font-serif text-lg font-medium">Delete this image?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The preview image will be permanently removed from this style.
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 rounded-full bg-destructive text-white hover:bg-destructive/90"
              >
                {deleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="size-4" /> Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ImageCard — single image preview + inline editor
// ---------------------------------------------------------------------------

type ImageCardProps = {
  image: AbayaImage;
  busy: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSetPrimary: () => void;
  onAngleChange: (angle: string) => void;
  onLabelCommit: (label: string) => void;
  onColorHexCommit: (colorHex: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
};

function ImageCard({
  image,
  busy,
  canMoveUp,
  canMoveDown,
  onSetPrimary,
  onAngleChange,
  onLabelCommit,
  onColorHexCommit,
  onMoveUp,
  onMoveDown,
  onDelete,
}: ImageCardProps) {
  const [labelDraft, setLabelDraft] = React.useState(image.label);
  const [colorDraft, setColorDraft] = React.useState(image.colorHex ?? "");
  const [imgError, setImgError] = React.useState(false);

  // Reset local drafts when the image id changes (e.g. after refetch).
  React.useEffect(() => {
    setLabelDraft(image.label);
    setColorDraft(image.colorHex ?? "");
    setImgError(false);
  }, [image.id, image.label, image.colorHex]);

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-opacity",
        busy && "opacity-60",
        image.isPrimary && "ring-1 ring-[var(--gold)]"
      )}
    >
      {/* Primary badge */}
      {image.isPrimary ? (
        <div className="absolute left-2 top-2 z-10">
          <Badge className="rounded-full bg-[var(--gold)] text-black hover:bg-[var(--gold)]">
            <Star className="size-3 fill-current" /> Primary
          </Badge>
        </div>
      ) : null}

      {/* Reorder controls */}
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp || busy}
          className="inline-flex size-7 items-center justify-center rounded-md bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Move up"
        >
          <ChevronUp className="size-4" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown || busy}
          className="inline-flex size-7 items-center justify-center rounded-md bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Move down"
        >
          <ChevronDown className="size-4" />
        </button>
      </div>

      {/* Image preview */}
      <div className="relative aspect-[3/4] w-full bg-secondary/40">
        {imgError ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
            <Images className="size-8 opacity-40" />
            <p className="text-xs">Image failed to load.</p>
            <p className="max-w-full truncate text-[0.65rem]">{image.url}</p>
          </div>
        ) : (
          <img
            src={image.url}
            alt={image.label || image.angle}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40">
            <Loader2 className="size-6 animate-spin text-foreground" />
          </div>
        ) : null}
      </div>

      {/* Controls */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <Select
            value={image.angle}
            onValueChange={(v) => onAngleChange(v)}
          >
            <SelectTrigger size="sm" className="flex-1 capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANGLES.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!image.isPrimary ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onSetPrimary}
              disabled={busy}
              className="rounded-full"
              title="Set as primary hero image"
            >
              <Star className="size-3.5" /> Set Primary
            </Button>
          ) : null}
        </div>

        <Label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Label
          </span>
          <Input
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onBlur={() => onLabelCommit(labelDraft)}
            disabled={busy}
            placeholder="e.g. Front View"
            className="h-8 text-sm"
          />
        </Label>

        <Label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Color link (optional)
          </span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colorDraft || "#ffffff"}
              onChange={(e) => setColorDraft(e.target.value)}
              onBlur={() => onColorHexCommit(colorDraft)}
              disabled={busy}
              className="size-8 flex-none cursor-pointer rounded-md border bg-background p-0.5"
              aria-label="Color picker"
              title="Link this image to a color"
            />
            <Input
              value={colorDraft}
              onChange={(e) => setColorDraft(e.target.value)}
              onBlur={() => onColorHexCommit(colorDraft)}
              disabled={busy}
              placeholder="none"
              className="h-8 flex-1 text-sm"
            />
            {colorDraft ? (
              <span
                className="size-6 flex-none rounded-full ring-1 ring-inset ring-black/10"
                style={{ backgroundColor: colorDraft }}
                title={colorDraft}
              />
            ) : null}
          </div>
        </Label>

        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-[0.65rem] text-muted-foreground">
            order #{image.sortOrder}
          </span>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="inline-flex size-8 items-center justify-center rounded-md text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
            aria-label="Delete image"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminAbayaImages;
