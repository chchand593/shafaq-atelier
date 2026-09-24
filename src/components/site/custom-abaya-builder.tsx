"use client";

import * as React from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Ruler,
  Upload,
  X,
  ShoppingBag,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Search as SearchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import { useCart, useUI } from "@/lib/store";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// API response shapes (mirror the customer-facing endpoints)
// ---------------------------------------------------------------------------

type ApiColor = {
  id: string;
  name: string;
  hex: string;
  sortOrder: number;
};

type ApiFabric = {
  id: string;
  name: string;
  description: string;
  additionalPrice: number;
  themeValue: string | null;
  sortOrder: number;
};

type ApiOption = {
  id: string;
  name: string;
  description: string | null;
  optionType: string;
  additionalPrice: number;
  sortOrder: number;
};

type ApiAbayaImage = {
  id: string;
  url: string;
  angle: string;
  label: string;
  isPrimary: boolean;
  colorHex: string | null;
  sortOrder: number;
};

type ApiAbayaStyle = {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: ApiAbayaImage[];
};

type BuilderData = {
  colors: ApiColor[];
  fabrics: ApiFabric[];
  styleOptions: ApiOption[];
  sleevesOptions: ApiOption[];
  hijabOptions: ApiOption[];
  embroideryOptions: ApiOption[];
  detailsOptions: ApiOption[];
  basePrice: number;
  abayaStyles: ApiAbayaStyle[];
};

// ---------------------------------------------------------------------------
// Configuration state
// ---------------------------------------------------------------------------

type CustomConfig = {
  style: string | null;
  fabric: string | null;
  color: string | null;
  sleeves: string | null;
  hijab: string | null;
  embroidery: string | null;
  details: string[];
  measurements: Record<string, string>;
  referenceImage: string | null;
  referenceImageName: string | null;
  instructions: string;
};

const EMPTY_CONFIG: CustomConfig = {
  style: null,
  fabric: null,
  color: null,
  sleeves: null,
  hijab: null,
  embroidery: null,
  details: [],
  measurements: {},
  referenceImage: null,
  referenceImageName: null,
  instructions: "",
};

const MEASUREMENT_FIELDS = [
  { id: "height", label: "Height (cm)", placeholder: "165" },
  { id: "bust", label: "Bust (cm)", placeholder: "94" },
  { id: "waist", label: "Waist (cm)", placeholder: "76" },
  { id: "hips", label: "Hips (cm)", placeholder: "100" },
  { id: "sleeveLength", label: "Sleeve Length (cm)", placeholder: "60" },
  { id: "abayaLength", label: "Abaya Length (cm)", placeholder: "140" },
];

const CRAFTING_DAYS = "10–14 business days";
// Fallback only — the real base price is fetched from /api/payments/config.
const FALLBACK_BASE_PRICE = 15000;

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

type StepId =
  | "style"
  | "fabric"
  | "color"
  | "sleeves"
  | "hijab"
  | "embroidery"
  | "details"
  | "measurements"
  | "reference"
  | "instructions"
  | "review";

const STEPS: { id: StepId; label: string; short: string }[] = [
  { id: "style", label: "Style", short: "1" },
  { id: "fabric", label: "Fabric", short: "2" },
  { id: "color", label: "Color", short: "3" },
  { id: "sleeves", label: "Sleeves", short: "4" },
  { id: "hijab", label: "Hijab", short: "5" },
  { id: "embroidery", label: "Embroidery", short: "6" },
  { id: "details", label: "Details", short: "7" },
  { id: "measurements", label: "Measurements", short: "8" },
  { id: "reference", label: "Reference Image", short: "9" },
  { id: "instructions", label: "Special Instructions", short: "10" },
  { id: "review", label: "Review", short: "11" },
];

// ---------------------------------------------------------------------------
// Colour utilities — luminance, readable text-on-colour, rgba, data URI
// ---------------------------------------------------------------------------

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  let h = (hex || "").trim();
  if (!h) return null;
  if (!h.startsWith("#")) h = "#" + h;
  const full =
    h.length === 4
      ? "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]
      : h;
  const m = /^#([0-9a-fA-F]{6})$/.exec(full);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// Relative luminance in the 0..1 range, per the formula in the task spec.
function luminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0.5;
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
}

// Choose a readable text colour for text placed on top of `hex`.
// Dark colours → white text; very light colours → near-black text.
function textOn(hex: string): string {
  const lum = luminance(hex);
  if (lum < 0.3) return "#ffffff";
  if (lum > 0.7) return "#1a1a1a";
  return "#ffffff";
}

function hexToRgba(hex: string, alpha: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return `rgba(0,0,0,${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

// Build an inline-SVG data URI showing a solid colour swatch. Used as the cart
// line image for custom abayas so the cart thumbnail reflects the chosen colour.
function colorDataUri(hex: string, label = "Custom Abaya"): string {
  const textColor = textOn(hex);
  const safeLabel = label.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="250" viewBox="0 0 200 250">` +
    `<rect width="200" height="250" fill="${hex}"/>` +
    `<text x="100" y="230" font-family="Georgia, serif" font-size="13" fill="${textColor}" fill-opacity="0.85" text-anchor="middle">${safeLabel}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ---------------------------------------------------------------------------
// Data fetching hook — loads colors, fabrics, customization options and the
// custom abaya base price on mount. Surfaces loading/error/retry states.
// ---------------------------------------------------------------------------

function useBuilderData() {
  const [data, setData] = React.useState<BuilderData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [colorsRes, fabricsRes, optionsRes, paymentsRes, stylesRes] = await Promise.all(
        [
          fetch("/api/colors"),
          fetch("/api/fabrics"),
          fetch("/api/customization-options"),
          fetch("/api/payments/config"),
          fetch("/api/abaya-styles"),
        ]
      );

      // paymentsRes is allowed to fail gracefully (we fall back to the default
      // base price); the three catalog endpoints are required. abaya-styles is
      // also allowed to fail gracefully (the preview gallery will show a
      // fallback image instead of angle thumbnails).
      if (!colorsRes.ok || !fabricsRes.ok || !optionsRes.ok) {
        throw new Error("Failed to load customization data. Please try again.");
      }

      const colors =
        ((await colorsRes.json()) as { colors?: ApiColor[] }).colors ?? [];
      const fabrics =
        ((await fabricsRes.json()) as { fabrics?: ApiFabric[] }).fabrics ?? [];
      const options =
        ((await optionsRes.json()) as { options?: ApiOption[] }).options ?? [];

      let basePrice = FALLBACK_BASE_PRICE;
      if (paymentsRes.ok) {
        const pay = (await paymentsRes.json()) as {
          customAbayaBasePrice?: number;
        };
        if (
          typeof pay.customAbayaBasePrice === "number" &&
          pay.customAbayaBasePrice > 0
        ) {
          basePrice = pay.customAbayaBasePrice;
        }
      }

      let abayaStyles: ApiAbayaStyle[] = [];
      if (stylesRes.ok) {
        abayaStyles =
          ((await stylesRes.json()) as { styles?: ApiAbayaStyle[] }).styles ?? [];
      }

      const groupBy = (type: string) =>
        options
          .filter((o) => (o.optionType || "").toLowerCase() === type)
          .sort((a, b) => a.sortOrder - b.sortOrder);

      setData({
        colors,
        fabrics,
        styleOptions: groupBy("style"),
        sleevesOptions: groupBy("sleeves"),
        hijabOptions: groupBy("hijab"),
        embroideryOptions: groupBy("embroidery"),
        detailsOptions: groupBy("details"),
        basePrice,
        abayaStyles,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, retry: load };
}

// ---------------------------------------------------------------------------
// Loading / error states
// ---------------------------------------------------------------------------

function BuilderLoading() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <Loader2 className="size-8 animate-spin text-[var(--gold)]" />
      <div>
        <p className="font-serif text-lg font-medium">Loading the atelier…</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Fetching fabrics, colours and customization options.
        </p>
      </div>
    </div>
  );
}

function BuilderError({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-6" />
      </span>
      <div>
        <p className="font-serif text-lg font-medium">
          Couldn’t load the builder
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {message || "Please check your connection and try again."}
        </p>
      </div>
      <Button onClick={onRetry} variant="outline" className="rounded-full">
        <Loader2 className="size-4" />
        Retry
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview Gallery — large main image + angle thumbnails
// Shows the selected abaya style's images. When a color is selected, if an
// image with a matching colorHex exists, it is shown instead.
// ---------------------------------------------------------------------------

const FALLBACK_PREVIEW = "/images/custom.jpg";

function PreviewGallery({
  abayaStyles,
  selectedStyleId,
  selectedColor,
}: {
  abayaStyles: ApiAbayaStyle[];
  selectedStyleId: string | null;
  selectedColor: ApiColor | null;
}) {
  // Find the selected style's images
  const style = React.useMemo(
    () => abayaStyles.find((s) => s.id === selectedStyleId) ?? null,
    [abayaStyles, selectedStyleId]
  );

  const images = style?.images ?? [];

  // Determine the active image: if a color is selected, prefer an image with
  // matching colorHex; otherwise use the primary image; otherwise use the first.
  const [activeIdx, setActiveIdx] = React.useState(0);

  // Reset active index when the style changes or when color changes
  React.useEffect(() => {
    if (images.length === 0) return;
    if (selectedColor) {
      const colorMatchIdx = images.findIndex(
        (img) => img.colorHex?.toLowerCase() === selectedColor.hex.toLowerCase()
      );
      if (colorMatchIdx >= 0) {
        setActiveIdx(colorMatchIdx);
        return;
      }
    }
    const primaryIdx = images.findIndex((img) => img.isPrimary);
    setActiveIdx(primaryIdx >= 0 ? primaryIdx : 0);
  }, [selectedStyleId, selectedColor?.hex, images.length]);

  if (images.length === 0) {
    // Fallback: show a single placeholder image
    return (
      <div className="overflow-hidden rounded-xl border bg-secondary">
        <div className="relative aspect-[4/5] w-full">
          <img
            src={FALLBACK_PREVIEW}
            alt="Custom Abaya Preview"
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-3 left-3 rounded-full bg-background/85 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
            Preview
          </div>
        </div>
      </div>
    );
  }

  const activeImage = images[activeIdx] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Large main preview */}
      <div className="group relative overflow-hidden rounded-xl border bg-secondary">
        <div className="relative aspect-[4/5] w-full">
          <img
            key={activeImage.id}
            src={activeImage.url}
            alt={activeImage.label || `${style?.name ?? "Abaya"} — ${activeImage.angle}`}
            className="h-full w-full object-cover transition-opacity duration-300"
          />
          {/* Angle label badge */}
          <div className="absolute bottom-3 left-3 rounded-full bg-background/85 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
            {activeImage.label || activeImage.angle}
          </div>
          {/* Color indicator badge (if color selected) */}
          {selectedColor ? (
            <div
              className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6rem] font-medium shadow-sm backdrop-blur"
              style={{
                backgroundColor: "var(--accent-soft)",
                color: "var(--accent-color)",
              }}
            >
              <span
                className="size-3 rounded-full ring-1 ring-inset ring-black/10"
                style={{ backgroundColor: selectedColor.hex }}
              />
              {selectedColor.name}
            </div>
          ) : null}
          {/* Image counter */}
          <div className="absolute bottom-3 right-3 rounded-full bg-background/85 px-2.5 py-0.5 text-[0.6rem] font-medium text-muted-foreground backdrop-blur">
            {activeIdx + 1} / {images.length}
          </div>
        </div>
      </div>

      {/* Angle thumbnails */}
      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIdx(i)}
              aria-label={`View ${img.label || img.angle}`}
              aria-pressed={i === activeIdx}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border bg-secondary transition-all",
                i === activeIdx
                  ? "border-[var(--accent-color)] ring-2 ring-[var(--accent-ring)]"
                  : "border-border opacity-70 hover:opacity-100"
              )}
            >
              <img
                src={img.url}
                alt=""
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1 text-center text-[0.5rem] font-medium uppercase tracking-wider text-white">
                {img.angle}
              </span>
              {/* Color-specific indicator */}
              {img.colorHex ? (
                <span
                  className="absolute right-1 top-1 size-2.5 rounded-full ring-1 ring-white/80"
                  style={{ backgroundColor: img.colorHex }}
                />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fabric Preview — shows the selected fabric's info beside/below the gallery
// ---------------------------------------------------------------------------

function FabricPreview({ fabric }: { fabric: ApiFabric | null }) {
  if (!fabric) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
        Select a fabric to see its preview
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border p-4 transition-colors"
      style={{
        backgroundColor: fabric.themeValue
          ? hexToRgba(fabric.themeValue, 0.07)
          : "transparent",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Fabric swatch */}
        <span
          className="flex size-12 flex-none items-center justify-center rounded-lg border ring-1 ring-inset ring-black/5"
          style={{
            backgroundColor: fabric.themeValue || "var(--secondary)",
          }}
        >
          <ShirtIcon className="size-5" style={{ color: "var(--accent-color)" }} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-sm font-medium leading-tight">
            {fabric.name}
          </p>
          {fabric.description ? (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {fabric.description}
            </p>
          ) : null}
        </div>
      </div>
      {fabric.additionalPrice > 0 ? (
        <p
          className="mt-3 text-xs font-medium"
          style={{ color: "var(--accent-color)" }}
        >
          +{formatPKR(fabric.additionalPrice)}
        </p>
      ) : (
        <p className="mt-3 text-xs font-medium text-muted-foreground">
          Included in base
        </p>
      )}
    </div>
  );
}

// Minimal Shirt icon (to avoid importing another lucide icon name collision)
function ShirtIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 1 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 1 2 0 0 0-1.34-2.23z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main builder component
// ---------------------------------------------------------------------------

export function CustomAbayaBuilder() {
  const { data, loading, error, retry } = useBuilderData();

  if (loading) return <BuilderLoading />;
  if (error || !data) {
    return <BuilderError message={error} onRetry={retry} />;
  }

  return <Builder data={data} retry={retry} />;
}

// ---------------------------------------------------------------------------
// Builder (loaded state) — owns the wizard state and dynamic theming
// ---------------------------------------------------------------------------

function Builder({ data }: { data: BuilderData; retry: () => void }) {
  const [stepIdx, setStepIdx] = React.useState(0);
  const [config, setConfig] = React.useState<CustomConfig>(EMPTY_CONFIG);
  const [adding, setAdding] = React.useState(false);
  const addToCart = useCart((s) => s.add);
  const setCartOpen = useUI((s) => s.setCartOpen);

  const currentStep = STEPS[stepIdx];

  // --- Derived: selected color + dynamic accent theming --------------------
  const selectedColor = React.useMemo(
    () => data.colors.find((c) => c.id === config.color) ?? null,
    [data.colors, config.color]
  );
  const selectedFabric = React.useMemo(
    () => data.fabrics.find((f) => f.id === config.fabric) ?? null,
    [data.fabrics, config.fabric]
  );

  // Accent = selected color hex, or fall back to brand gold so early steps
  // (style/fabric) look polished before a color is chosen.
  const accentHex = selectedColor?.hex || "var(--gold)";
  const accentText = selectedColor ? textOn(selectedColor.hex) : "#1a1a1a";
  const accentSoft = selectedColor
    ? hexToRgba(selectedColor.hex, 0.08)
    : "rgba(201, 162, 75, 0.08)";
  const accentRing = selectedColor
    ? hexToRgba(selectedColor.hex, 0.32)
    : "rgba(201, 162, 75, 0.32)";

  // Fabric secondary theme — used as a subtle tint on the fabric step only.
  const fabricHex = selectedFabric?.themeValue || "transparent";
  const fabricSoft =
    selectedFabric?.themeValue
      ? hexToRgba(selectedFabric.themeValue, 0.07)
      : "transparent";

  // CSS variables applied to the builder container. These drive the dynamic
  // accent colour used by selected cards, progress indicators, checkmarks and
  // the price highlight. Inline style updates instantly on re-render.
  const containerStyle = {
    "--accent-color": accentHex,
    "--accent-text": accentText,
    "--accent-soft": accentSoft,
    "--accent-ring": accentRing,
    "--fabric-color": fabricHex,
    "--fabric-soft": fabricSoft,
  } as React.CSSProperties;

  // --- Derived: price calculation ------------------------------------------
  const priceLines = React.useMemo(() => {
    const lines: { label: string; value: number }[] = [
      { label: "Base (bespoke craftsmanship)", value: data.basePrice },
    ];
    const styleOpt = data.styleOptions.find((o) => o.id === config.style);
    if (styleOpt) lines.push({ label: styleOpt.name, value: styleOpt.additionalPrice });
    if (selectedFabric)
      lines.push({ label: selectedFabric.name, value: selectedFabric.additionalPrice });
    if (selectedColor)
      lines.push({ label: selectedColor.name, value: 0 });
    const sleevesOpt = data.sleevesOptions.find((o) => o.id === config.sleeves);
    if (sleevesOpt) lines.push({ label: sleevesOpt.name, value: sleevesOpt.additionalPrice });
    const hijabOpt = data.hijabOptions.find((o) => o.id === config.hijab);
    if (hijabOpt) lines.push({ label: hijabOpt.name, value: hijabOpt.additionalPrice });
    const embOpt = data.embroideryOptions.find((o) => o.id === config.embroidery);
    if (embOpt) lines.push({ label: embOpt.name, value: embOpt.additionalPrice });
    for (const dId of config.details) {
      const d = data.detailsOptions.find((o) => o.id === dId);
      if (d) lines.push({ label: d.name, value: d.additionalPrice });
    }
    return lines;
  }, [data, config, selectedColor, selectedFabric]);

  const total = priceLines.reduce((sum, l) => sum + l.value, 0);

  // --- Navigation ----------------------------------------------------------
  const next = () => {
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
  };
  const back = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  };
  const goTo = (idx: number) => setStepIdx(idx);

  // --- Validation per step -------------------------------------------------
  const stepValid = (): boolean => {
    const s = currentStep.id;
    if (s === "style") return config.style !== null;
    if (s === "fabric") return config.fabric !== null;
    if (s === "color") return config.color !== null;
    if (s === "sleeves") return config.sleeves !== null;
    if (s === "hijab") return config.hijab !== null;
    if (s === "embroidery") return config.embroidery !== null;
    if (s === "measurements") {
      return MEASUREMENT_FIELDS.every(
        (f) => config.measurements[f.id]?.trim() !== ""
      );
    }
    return true;
  };

  // --- Add to cart ---------------------------------------------------------
  const onAddToCart = () => {
    setAdding(true);
    const color = selectedColor;
    const customId = `custom-${Date.now()}`;

    // Use the selected abaya style's primary image (or color-matched image)
    // as the cart thumbnail. Fall back to the colorDataUri if no style image
    // is available, then to the custom.jpg placeholder.
    const selectedStyle = data.abayaStyles.find((s) => s.id === config.style);
    const styleImages = selectedStyle?.images ?? [];
    let image: string;
    if (color) {
      const colorMatch = styleImages.find(
        (img) => img.colorHex?.toLowerCase() === color.hex.toLowerCase()
      );
      const primary = styleImages.find((img) => img.isPrimary);
      image = (colorMatch || primary || styleImages[0])?.url || colorDataUri(color.hex, "Custom Abaya");
    } else {
      const primary = styleImages.find((img) => img.isPrimary);
      image = primary?.url || styleImages[0]?.url || "/images/custom.jpg";
    }

    // Build a complete customization payload so the order line preserves
    // every choice the customer made (style, fabric, sleeves, hijab,
    // embroidery, details, measurements, referenceImage, instructions).
    // This is what the admin sees in the order detail view.
    const styleOpt = data.styleOptions.find((o) => o.id === config.style) ?? null;
    const selectedSleeve = data.sleevesOptions.find((o) => o.id === config.sleeves) ?? null;
    const selectedHijab = data.hijabOptions.find((o) => o.id === config.hijab) ?? null;
    const selectedEmbroidery = data.embroideryOptions.find((o) => o.id === config.embroidery) ?? null;
    const selectedDetails = config.details
      .map((id) => data.detailsOptions.find((o) => o.id === id))
      .filter((o): o is NonNullable<typeof o> => o !== undefined);

    const customizationPayload = {
      style: styleOpt
        ? { id: styleOpt.id, name: styleOpt.name, additionalPrice: styleOpt.additionalPrice }
        : null,
      abayaStyle: selectedStyle
        ? { id: selectedStyle.id, name: selectedStyle.name, slug: selectedStyle.slug }
        : null,
      fabric: selectedFabric
        ? { id: selectedFabric.id, name: selectedFabric.name, additionalPrice: selectedFabric.additionalPrice }
        : null,
      color: color ? { hex: color.hex, name: color.name } : null,
      sleeves: selectedSleeve
        ? { id: selectedSleeve.id, name: selectedSleeve.name, additionalPrice: selectedSleeve.additionalPrice }
        : null,
      hijab: selectedHijab
        ? { id: selectedHijab.id, name: selectedHijab.name, additionalPrice: selectedHijab.additionalPrice }
        : null,
      embroidery: selectedEmbroidery
        ? { id: selectedEmbroidery.id, name: selectedEmbroidery.name, additionalPrice: selectedEmbroidery.additionalPrice }
        : null,
      details: selectedDetails.map((d) => ({
        id: d.id,
        name: d.name,
        additionalPrice: d.additionalPrice,
      })),
      measurements: config.measurements,
      referenceImage: config.referenceImage
        ? {
            name: config.referenceImageName,
            dataUriLength: config.referenceImage.length,
            hasImage: true,
          }
        : null,
      instructions: config.instructions || "",
      basePrice: data.basePrice,
      additions: total - data.basePrice,
      total: total,
    };
    const customizationJson = JSON.stringify(customizationPayload);

    addToCart({
      productId: customId,
      name: "Custom Abaya",
      price: total,
      image,
      color: color?.hex || "#1a1a1a",
      colorName: color?.name || "Custom",
      size: "Custom",
      qty: 1,
      customization: customizationJson,
    });

    toast.success("Custom abaya added to your bag", {
      description: `Custom Abaya · ${color?.name || "Custom"} · ${formatPKR(total)}`,
    });

    setTimeout(() => {
      setAdding(false);
      setCartOpen(true);
    }, 500);
  };

  return (
    <div
      style={containerStyle}
      className="mx-auto max-w-6xl overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-12"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 text-center">
        <span className="eyebrow text-[var(--gold)]">Bespoke Atelier</span>
        <h1 className="font-serif text-3xl font-medium sm:text-4xl">
          Design Your Own Abaya
        </h1>
        <p className="mx-auto max-w-lg text-sm text-muted-foreground">
          Configure every detail — from fabric to embroidery — and our master
          artisans will craft a piece that is uniquely yours.{" "}
          <span className="font-medium text-foreground">
            Crafted in {CRAFTING_DAYS}.
          </span>
        </p>
      </div>

      {/* Layout: sidebar steps + content + price summary */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr_280px]">
        {/* Step sidebar (desktop) + progress (mobile) */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          {/* Mobile: compact progress dots */}
          <div className="flex gap-1 overflow-x-auto elegant-scroll lg:hidden">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                className={cn(
                  "flex size-8 flex-none items-center justify-center rounded-full border text-xs font-medium transition-all",
                  i === stepIdx
                    ? "border-transparent text-white"
                    : i < stepIdx
                      ? "border-[var(--accent-color)] bg-[var(--accent-soft)] text-[var(--accent-color)]"
                      : "border-border text-muted-foreground"
                )}
                style={
                  i === stepIdx
                    ? {
                        backgroundColor: "var(--accent-color)",
                        color: "var(--accent-text)",
                      }
                    : undefined
                }
              >
                {i < stepIdx ? <Check className="size-3.5" /> : s.short}
              </button>
            ))}
          </div>

          {/* Desktop: full step list */}
          <ol className="hidden space-y-1 lg:block">
            {STEPS.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all",
                    i === stepIdx
                      ? "bg-secondary font-medium"
                      : "text-muted-foreground hover:bg-secondary/50"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 flex-none items-center justify-center rounded-full border text-xs font-medium transition-all",
                      i === stepIdx
                        ? "border-transparent text-white"
                        : i < stepIdx
                          ? "border-[var(--accent-color)] bg-[var(--accent-soft)] text-[var(--accent-color)]"
                          : "border-border"
                    )}
                    style={
                      i === stepIdx
                        ? {
                            backgroundColor: "var(--accent-color)",
                            color: "var(--accent-text)",
                          }
                        : undefined
                    }
                  >
                    {i < stepIdx ? <Check className="size-3.5" /> : s.short}
                  </span>
                  <span className={cn(i < stepIdx && "text-foreground")}>
                    {s.label}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        {/* Step content + preview gallery */}
        <div className="min-w-0">
          {/* Preview gallery — large abaya preview with angle thumbnails.
              Shown on all steps so the customer always sees their configured
              abaya. Updates dynamically when style/color changes. */}
          <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_auto]">
            <PreviewGallery
              abayaStyles={data.abayaStyles}
              selectedStyleId={config.style}
              selectedColor={selectedColor}
            />
            {/* Fabric preview panel — shows beside the gallery on desktop */}
            <div className="w-full sm:w-48">
              <p className="eyebrow mb-2 text-[var(--mocha)]">Fabric</p>
              <FabricPreview fabric={selectedFabric} />
            </div>
          </div>

          <StepContent
            step={currentStep.id}
            config={config}
            setConfig={setConfig}
            data={data}
            selectedColor={selectedColor}
            selectedFabric={selectedFabric}
          />

          {/* Nav buttons */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={back}
              disabled={stepIdx === 0}
              className="rounded-full"
            >
              <ChevronLeft className="size-4" />
              Back
            </Button>
            {stepIdx < STEPS.length - 1 ? (
              <Button
                onClick={next}
                disabled={!stepValid()}
                className="rounded-full px-6"
              >
                Continue
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={onAddToCart}
                disabled={adding}
                className="rounded-full px-6"
              >
                {adding ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <ShoppingBag className="size-4" />
                    Add to Bag
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Price summary sidebar */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles
                className="size-4"
                style={{ color: "var(--accent-color)" }}
              />
              <h3 className="eyebrow text-[var(--mocha)]">Live Price</h3>
            </div>
            <p
              className="mt-3 font-serif text-3xl font-semibold"
              style={{ color: "var(--accent-color)" }}
            >
              {formatPKR(total)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Base {formatPKR(data.basePrice)} + options
            </p>

            <div className="mt-4 space-y-1.5 border-t pt-4 text-sm">
              {priceLines.map((l, i) => (
                <PriceLine key={`${l.label}-${i}`} label={l.label} value={l.value} />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <span className="font-serif text-base font-medium">Total</span>
              <span className="font-serif text-xl font-semibold">
                {formatPKR(total)}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
              <Ruler
                className="size-4 flex-none"
                style={{ color: "var(--accent-color)" }}
              />
              <span>Crafted in {CRAFTING_DAYS} after measurements confirmed.</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Price line helper
// ---------------------------------------------------------------------------

function PriceLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={value === 0 ? "text-muted-foreground" : "text-foreground"}>
        {value === 0 ? "Included" : `+${formatPKR(value)}`}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable option card — uses the dynamic accent for its selected state
// ---------------------------------------------------------------------------

function OptionCard({
  name,
  description,
  price,
  selected,
  onClick,
  extra,
}: {
  name: string;
  description?: string | null;
  price: number;
  selected: boolean;
  onClick: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all",
        selected
          ? "border-[var(--accent-color)] bg-[var(--accent-soft)]"
          : "border-border hover:border-foreground/30"
      )}
      style={selected ? { boxShadow: "0 0 0 2px var(--accent-ring)" } : undefined}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span className="font-serif text-base font-medium">{name}</span>
        {selected ? (
          <CheckCircle2
            className="size-5 flex-none"
            style={{ color: "var(--accent-color)" }}
          />
        ) : null}
      </div>
      {description ? (
        <span className="text-xs text-muted-foreground">{description}</span>
      ) : null}
      <span
        className={cn(
          "mt-1 text-sm font-medium",
          price === 0 ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {price === 0 ? "Included" : `+${formatPKR(price)}`}
      </span>
      {extra}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Color swatch — used in the color step grid
// ---------------------------------------------------------------------------

function ColorSwatch({
  color,
  selected,
  onClick,
}: {
  color: ApiColor;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={color.name}
      className={cn(
        "group flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all",
        selected
          ? "border-[var(--accent-color)] bg-[var(--accent-soft)]"
          : "border-border hover:border-foreground/30"
      )}
      style={selected ? { boxShadow: "0 0 0 2px var(--accent-ring)" } : undefined}
    >
      <span
        className="size-10 rounded-full ring-1 ring-inset ring-black/10"
        style={{ backgroundColor: color.hex }}
      />
      <span className="line-clamp-1 text-center text-[0.7rem] font-medium leading-tight">
        {color.name}
      </span>
      {selected ? (
        <span
          className="flex size-4 items-center justify-center rounded-full"
          style={{ backgroundColor: color.hex }}
        >
          <Check
            className="size-3"
            style={{ color: textOn(color.hex) }}
          />
        </span>
      ) : null}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Empty-state used when an option group has no active options
// ---------------------------------------------------------------------------

function EmptyOptions({ noun }: { noun: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-secondary/30 p-8 text-center">
      <p className="font-medium text-muted-foreground">
        No {noun} options available
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Please check back later or contact us to discuss your requirements.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step content renderer
// ---------------------------------------------------------------------------

function StepContent({
  step,
  config,
  setConfig,
  data,
  selectedColor,
  selectedFabric,
}: {
  step: StepId;
  config: CustomConfig;
  setConfig: React.Dispatch<React.SetStateAction<CustomConfig>>;
  data: BuilderData;
  selectedColor: ApiColor | null;
  selectedFabric: ApiFabric | null;
}) {
  const setSingle =
    (field: keyof CustomConfig) => (id: string) =>
      setConfig((c) => ({ ...c, [field]: id }));

  const toggleDetail = (id: string) =>
    setConfig((c) => ({
      ...c,
      details: c.details.includes(id)
        ? c.details.filter((d) => d !== id)
        : [...c.details, id],
    }));

  const setMeasurement = (field: string, value: string) =>
    setConfig((c) => ({
      ...c,
      measurements: { ...c.measurements, [field]: value },
    }));

  switch (step) {
    case "style":
      return (
        <StepShell
          title="Choose Your Style"
          desc="Select the silhouette that speaks to you. Each is crafted to drape beautifully."
        >
          {data.styleOptions.length === 0 ? (
            <EmptyOptions noun="style" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.styleOptions.map((o) => (
                <OptionCard
                  key={o.id}
                  name={o.name}
                  description={o.description}
                  price={o.additionalPrice}
                  selected={config.style === o.id}
                  onClick={() => setSingle("style")(o.id)}
                />
              ))}
            </div>
          )}
        </StepShell>
      );

    case "fabric":
      return (
        <StepShell
          title="Choose Your Fabric"
          desc="The fabric defines how your abaya flows and feels against your skin."
        >
          {data.fabrics.length === 0 ? (
            <EmptyOptions noun="fabric" />
          ) : (
            <div
              className="grid gap-3 rounded-xl p-1 sm:grid-cols-2"
              style={{
                backgroundColor:
                  selectedFabric?.themeValue ?? "transparent"
                    ? "var(--fabric-soft)"
                    : "transparent",
              }}
            >
              {data.fabrics.map((o) => {
                const selected = config.fabric === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSingle("fabric")(o.id)}
                    aria-pressed={selected}
                    className={cn(
                      "group relative flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all",
                      selected
                        ? "border-[var(--accent-color)] bg-[var(--accent-soft)]"
                        : "border-border bg-card hover:border-foreground/30"
                    )}
                    style={
                      selected
                        ? {
                            boxShadow: "0 0 0 2px var(--accent-ring)",
                            backgroundColor: o.themeValue
                              ? hexToRgba(o.themeValue, 0.12)
                              : undefined,
                          }
                        : undefined
                    }
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <span className="font-serif text-base font-medium">
                        {o.name}
                      </span>
                      {selected ? (
                        <CheckCircle2
                          className="size-5 flex-none"
                          style={{ color: "var(--accent-color)" }}
                        />
                      ) : null}
                    </div>
                    {o.description ? (
                      <span className="text-xs text-muted-foreground">
                        {o.description}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "mt-1 text-sm font-medium",
                        o.additionalPrice === 0
                          ? "text-muted-foreground"
                          : "text-foreground"
                      )}
                    >
                      {o.additionalPrice === 0
                        ? "Included"
                        : `+${formatPKR(o.additionalPrice)}`}
                    </span>
                    {o.themeValue ? (
                      <span
                        className="mt-1 inline-block h-1.5 w-10 rounded-full"
                        style={{ backgroundColor: o.themeValue }}
                        aria-hidden
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </StepShell>
      );

    case "color":
      return (
        <ColorStep
          colors={data.colors}
          selected={selectedColor}
          onSelect={(id) => setSingle("color")(id)}
        />
      );

    case "sleeves":
      return (
        <StepShell
          title="Choose Your Sleeves"
          desc="From classic cuffs to dramatic bells — sleeves define the character of your abaya."
        >
          {data.sleevesOptions.length === 0 ? (
            <EmptyOptions noun="sleeves" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.sleevesOptions.map((o) => (
                <OptionCard
                  key={o.id}
                  name={o.name}
                  description={o.description}
                  price={o.additionalPrice}
                  selected={config.sleeves === o.id}
                  onClick={() => setSingle("sleeves")(o.id)}
                />
              ))}
            </div>
          )}
        </StepShell>
      );

    case "hijab":
      return (
        <StepShell
          title="Choose Your Hijab"
          desc="Complete your look with a coordinating or contrasting headpiece."
        >
          {data.hijabOptions.length === 0 ? (
            <EmptyOptions noun="hijab" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.hijabOptions.map((o) => (
                <OptionCard
                  key={o.id}
                  name={o.name}
                  description={o.description}
                  price={o.additionalPrice}
                  selected={config.hijab === o.id}
                  onClick={() => setSingle("hijab")(o.id)}
                />
              ))}
            </div>
          )}
        </StepShell>
      );

    case "embroidery":
      return (
        <StepShell
          title="Choose Your Embroidery"
          desc="Hand-embroidered details add a touch of couture to your abaya."
        >
          {data.embroideryOptions.length === 0 ? (
            <EmptyOptions noun="embroidery" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.embroideryOptions.map((o) => (
                <OptionCard
                  key={o.id}
                  name={o.name}
                  description={o.description}
                  price={o.additionalPrice}
                  selected={config.embroidery === o.id}
                  onClick={() => setSingle("embroidery")(o.id)}
                />
              ))}
            </div>
          )}
        </StepShell>
      );

    case "details":
      return (
        <StepShell
          title="Add Details"
          desc="Optional extras to make your abaya perfectly yours. Select any that appeal."
        >
          {data.detailsOptions.length === 0 ? (
            <EmptyOptions noun="detail" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.detailsOptions.map((o) => (
                <OptionCard
                  key={o.id}
                  name={o.name}
                  description={o.description}
                  price={o.additionalPrice}
                  selected={config.details.includes(o.id)}
                  onClick={() => toggleDetail(o.id)}
                />
              ))}
            </div>
          )}
        </StepShell>
      );

    case "measurements":
      return (
        <StepShell
          title="Your Measurements"
          desc="Provide your measurements in centimetres so we can tailor your abaya to fit perfectly."
          icon={<Ruler className="size-5 text-[var(--gold)]" />}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {MEASUREMENT_FIELDS.map((f) => (
              <label key={f.id} className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {f.label} <span className="text-[var(--gold)]">*</span>
                </span>
                <Input
                  type="number"
                  value={config.measurements[f.id] || ""}
                  onChange={(e) => setMeasurement(f.id, e.target.value)}
                  placeholder={f.placeholder}
                  min={0}
                />
              </label>
            ))}
          </div>
          <div className="mt-4 rounded-lg border bg-secondary/40 p-4 text-sm">
            <p className="font-medium">Not sure of your measurements?</p>
            <p className="mt-1 text-muted-foreground">
              Book a free fitting consultation with our team. We'll confirm all measurements before crafting begins to ensure your custom abaya fits perfectly.
            </p>
          </div>
        </StepShell>
      );

    case "reference":
      return <ReferenceStep config={config} setConfig={setConfig} />;

    case "instructions":
      return (
        <StepShell
          title="Special Instructions"
          desc="Anything else you'd like our artisans to know? This is your space to be specific."
        >
          <Textarea
            value={config.instructions}
            onChange={(e) =>
              setConfig((c) => ({ ...c, instructions: e.target.value }))
            }
            placeholder="e.g. 'I'd like the belt to be detachable' or 'Please add a subtle train at the back'"
            rows={6}
            maxLength={1000}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {config.instructions.length}/1000 characters
          </p>
        </StepShell>
      );

    case "review":
      return (
        <ReviewStep
          config={config}
          data={data}
          total={0 /* unused, see below */}
          selectedColor={selectedColor}
        />
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Color step — scrollable, searchable grid of all (100+) colours
// ---------------------------------------------------------------------------

function ColorStep({
  colors,
  selected,
  onSelect,
}: {
  colors: ApiColor[];
  selected: ApiColor | null;
  onSelect: (id: string) => void;
}) {
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return colors;
    return colors.filter((c) => c.name.toLowerCase().includes(term));
  }, [colors, q]);

  return (
    <StepShell
      title="Choose Your Colour"
      desc={
        selected
          ? `Selected — ${selected.name}. The accent of this builder now follows your colour.`
          : "Pick the shade that complements your style. Selecting a colour re-themes the builder accent instantly."
      }
    >
      {colors.length === 0 ? (
        <EmptyOptions noun="colour" />
      ) : (
        <>
          {/* Search */}
          <div className="relative mb-4 max-w-sm">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${colors.length} colours…`}
              aria-label="Search colours"
              className="pl-9"
            />
            {q ? (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label="Clear colour search"
                className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          {/* Selected colour chip */}
          {selected ? (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--accent-color)] bg-[var(--accent-soft)] py-1 pl-1.5 pr-3 text-sm">
              <span
                className="size-5 rounded-full ring-1 ring-inset ring-black/10"
                style={{ backgroundColor: selected.hex }}
              />
              <span className="font-medium">{selected.name}</span>
            </div>
          ) : null}

          {/* Scrollable grid */}
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No colours match “{q}”.
            </p>
          ) : (
            <div className="max-h-[28rem] overflow-y-auto elegant-scroll pr-1">
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7">
                {filtered.map((c) => (
                  <ColorSwatch
                    key={c.id}
                    color={c}
                    selected={selected?.id === c.id}
                    onClick={() => onSelect(c.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </StepShell>
  );
}

// ---------------------------------------------------------------------------
// Step shell wrapper
// ---------------------------------------------------------------------------

function StepShell({
  title,
  desc,
  icon,
  children,
}: {
  title: string;
  desc: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        {icon}
        <div>
          <h2 className="font-serif text-2xl font-medium">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reference image step
// ---------------------------------------------------------------------------

function ReferenceStep({
  config,
  setConfig,
}: {
  config: CustomConfig;
  setConfig: React.Dispatch<React.SetStateAction<CustomConfig>>;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large", {
        description: "Please upload an image under 5MB.",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setConfig((c) => ({
        ...c,
        referenceImage: reader.result as string,
        referenceImageName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setConfig((c) => ({
      ...c,
      referenceImage: null,
      referenceImageName: null,
    }));
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <StepShell
      title="Reference Image"
      desc="Upload an inspiration image so our artisans can see exactly what you envision. (Optional)"
      icon={<ImageIcon className="size-5 text-[var(--gold)]" />}
    >
      {config.referenceImage ? (
        <div className="space-y-3">
          <div className="relative inline-block">
            <img
              src={config.referenceImage}
              alt="Reference"
              className="max-h-64 rounded-xl border object-contain"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -right-2 -top-2 inline-flex size-7 items-center justify-center rounded-full bg-destructive text-white shadow-sm"
              aria-label="Remove image"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {config.referenceImageName}
          </p>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 text-center transition-colors hover:border-foreground/30"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-[var(--mocha)]">
            <Upload className="size-6" />
          </span>
          <div>
            <p className="font-medium">Click to upload</p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, or WebP — max 5MB
            </p>
          </div>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={onFile}
        className="hidden"
      />
    </StepShell>
  );
}

// ---------------------------------------------------------------------------
// Review step
// ---------------------------------------------------------------------------

function ReviewStep({
  config,
  data,
  selectedColor,
}: {
  config: CustomConfig;
  data: BuilderData;
  total: number;
  selectedColor: ApiColor | null;
}) {
  // Recompute the breakdown here so the review step is self-contained.
  const lines: { label: string; value: number }[] = [
    { label: "Base (bespoke craftsmanship)", value: data.basePrice },
  ];
  const styleOpt = data.styleOptions.find((o) => o.id === config.style);
  if (styleOpt) lines.push({ label: styleOpt.name, value: styleOpt.additionalPrice });
  const fabric = data.fabrics.find((f) => f.id === config.fabric);
  if (fabric) lines.push({ label: fabric.name, value: fabric.additionalPrice });
  if (selectedColor) lines.push({ label: selectedColor.name, value: 0 });
  const sleevesOpt = data.sleevesOptions.find((o) => o.id === config.sleeves);
  if (sleevesOpt) lines.push({ label: sleevesOpt.name, value: sleevesOpt.additionalPrice });
  const hijabOpt = data.hijabOptions.find((o) => o.id === config.hijab);
  if (hijabOpt) lines.push({ label: hijabOpt.name, value: hijabOpt.additionalPrice });
  const embOpt = data.embroideryOptions.find((o) => o.id === config.embroidery);
  if (embOpt) lines.push({ label: embOpt.name, value: embOpt.additionalPrice });
  for (const dId of config.details) {
    const d = data.detailsOptions.find((o) => o.id === dId);
    if (d) lines.push({ label: d.name, value: d.additionalPrice });
  }
  const total = lines.reduce((sum, l) => sum + l.value, 0);

  // Build a readable summary for the design card.
  const summary: Record<string, string> = {};
  if (styleOpt) summary.Style = styleOpt.name;
  if (fabric) summary.Fabric = fabric.name;
  if (selectedColor) summary.Colour = selectedColor.name;
  if (sleevesOpt) summary.Sleeves = sleevesOpt.name;
  if (hijabOpt) summary.Hijab = hijabOpt.name;
  if (embOpt) summary.Embroidery = embOpt.name;
  if (config.details.length > 0) {
    summary.Details = config.details
      .map((d) => data.detailsOptions.find((o) => o.id === d)?.name)
      .filter(Boolean)
      .join(", ");
  }
  if (config.measurements.abayaLength) {
    summary.Length = `${config.measurements.abayaLength} cm`;
  }

  return (
    <StepShell
      title="Review Your Design"
      desc="Take a final look at your configuration. When you're ready, add it to your bag and proceed to checkout."
      icon={<CheckCircle2 className="size-5 text-[var(--gold)]" />}
    >
      <div className="space-y-5">
        {/* Design preview card */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="grid sm:grid-cols-[200px_1fr]">
            {/* Visual */}
            <div className="relative aspect-[4/5] bg-secondary sm:aspect-auto">
              {config.referenceImage ? (
                <img
                  src={config.referenceImage}
                  alt="Your custom abaya reference"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center"
                  style={{
                    background: `linear-gradient(135deg, ${selectedColor?.hex || "#1a1a1a"}22, ${selectedColor?.hex || "#1a1a1a"}08)`,
                  }}
                >
                  <div
                    className="size-16 rounded-full ring-2 ring-inset ring-black/10"
                    style={{ backgroundColor: selectedColor?.hex || "#1a1a1a" }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {selectedColor?.name || "Custom"} abaya preview
                  </span>
                </div>
              )}
            </div>
            {/* Details */}
            <div className="p-5">
              <Badge className="bg-[var(--gold)]/15 text-[var(--gold)]">
                Bespoke
              </Badge>
              <h3 className="mt-2 font-serif text-xl font-medium">
                Custom Abaya
                {styleOpt ? ` — ${styleOpt.name}` : ""}
              </h3>
              <dl className="mt-4 space-y-1.5 text-sm">
                {Object.entries(summary).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Measurements summary */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-serif text-lg font-medium">
            <Ruler className="size-4 text-[var(--gold)]" />
            Measurements
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {MEASUREMENT_FIELDS.map((f) => (
              <div key={f.id} className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">
                  {f.label.replace(" (cm)", "")}
                </span>
                <span className="font-medium">
                  {config.measurements[f.id] || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        {config.instructions ? (
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-serif text-lg font-medium">
              Special Instructions
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {config.instructions}
            </p>
          </div>
        ) : null}

        {/* Price summary */}
        <div className="rounded-xl border bg-primary p-5 text-primary-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow text-[var(--gold-soft)]">Your Total</p>
              <p className="mt-1 font-serif text-3xl font-semibold">
                {formatPKR(total)}
              </p>
            </div>
            <div className="text-right text-sm text-primary-foreground/70">
              <p>Crafted in {CRAFTING_DAYS}</p>
              <p className="mt-1">Free nationwide delivery</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Click <span className="font-medium text-foreground">Add to Bag</span>{" "}
          below to add your custom abaya to your existing cart, then proceed
          through our secure checkout.
        </p>
      </div>
    </StepShell>
  );
}

export default CustomAbayaBuilder;
