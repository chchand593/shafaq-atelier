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
  ArrowRight,
  Loader2,
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
// Configuration data
// ---------------------------------------------------------------------------

type Option = {
  id: string;
  label: string;
  price: number;
  desc?: string;
};

const STYLES: Option[] = [
  { id: "closed-front", label: "Closed Front", price: 0, desc: "Classic seamless silhouette" },
  { id: "open-front", label: "Open Front", price: 0, desc: "Layered with inner dress" },
  { id: "kimono", label: "Kimono / Flared", price: 2000, desc: "Wide, flowing silhouette" },
  { id: "wrap", label: "Wrap Style", price: 3000, desc: "Adjustable wrap with belt" },
];

const FABRICS: Option[] = [
  { id: "nida", label: "Washed Nida", price: 0, desc: "Soft, buttery, subtle sheen" },
  { id: "matte-crepe", label: "Matte Crepe", price: 1000, desc: "Fluid, breathable, structured" },
  { id: "satin-crepe", label: "Satin Crepe", price: 2000, desc: "Lustrous, elegant drape" },
  { id: "chiffon", label: "Chiffon", price: 1500, desc: "Lightweight, airy, layered" },
  { id: "silk-blend", label: "Silk Blend", price: 5000, desc: "Premium, luxurious feel" },
];

const COLORS: Option[] & { hex: string }[] = [
  { id: "black", label: "Black", price: 0, hex: "#1a1a1a" } as Option & { hex: string },
  { id: "mocha", label: "Mocha", price: 0, hex: "#6b5246" } as Option & { hex: string },
  { id: "beige", label: "Beige", price: 0, hex: "#d8c7a8" } as Option & { hex: string },
  { id: "charcoal", label: "Charcoal", price: 0, hex: "#3a3633" } as Option & { hex: string },
  { id: "cream", label: "Cream", price: 500, hex: "#e8dcc4" } as Option & { hex: string },
  { id: "gold", label: "Gold", price: 2000, hex: "#c9a24b" } as Option & { hex: string },
  { id: "sage", label: "Sage", price: 1000, hex: "#8a9a7b" } as Option & { hex: string },
  { id: "navy", label: "Navy", price: 1000, hex: "#2a3441" } as Option & { hex: string },
];

const SLEEVES: Option[] = [
  { id: "standard-cuff", label: "Standard Cuff", price: 0, desc: "Clean fitted cuff" },
  { id: "bell", label: "Bell Sleeves", price: 1500, desc: "Dramatic flared bell" },
  { id: "flared", label: "Flared Sleeves", price: 1000, desc: "Gentle flare from elbow" },
  { id: "cuffed", label: "Cuffed Sleeves", price: 800, desc: "Fold-back cuffs" },
  { id: "button", label: "Button Detail", price: 1200, desc: "Decorative button placket" },
];

const HIJAB: Option[] = [
  { id: "none", label: "None (abaya only)", price: 0, desc: "Abaya without headwear" },
  { id: "matching-shayla", label: "Matching Shayla", price: 1500, desc: "Coordinating scarf" },
  { id: "contrasting-shayla", label: "Contrasting Shayla", price: 1500, desc: "Contrast colour scarf" },
  { id: "khimar", label: "Matching Khimar", price: 2500, desc: "Full head + shoulder cover" },
  { id: "embroidered-shayla", label: "Embroidered Shayla", price: 3000, desc: "Scarf with gold trim" },
];

const EMBROIDERY: Option[] = [
  { id: "none", label: "None", price: 0, desc: "Clean, minimal" },
  { id: "minimal-cuff", label: "Minimal Cuff", price: 2000, desc: "Subtle detailing on cuffs" },
  { id: "sleeve-border", label: "Sleeve Border", price: 3500, desc: "Decorative border along sleeves" },
  { id: "front-placket", label: "Front Placket", price: 4000, desc: "Embroidery along the front" },
  { id: "full", label: "Full Embroidery", price: 8000, desc: "All-over intricate design" },
  { id: "gold-thread", label: "Gold Thread", price: 5000, desc: "Hand-embroidered gold work" },
];

const DETAILS: Option[] = [
  { id: "belt", label: "Belt", price: 1000 },
  { id: "pockets", label: "Pockets", price: 500 },
  { id: "buttons", label: "Buttons", price: 800 },
  { id: "hood", label: "Hood", price: 1500 },
  { id: "zipper", label: "Zipper Closure", price: 600 },
  { id: "inner-dress", label: "Inner Dress", price: 2500 },
];

const MEASUREMENT_FIELDS = [
  { id: "height", label: "Height (cm)", placeholder: "165" },
  { id: "bust", label: "Bust (cm)", placeholder: "94" },
  { id: "waist", label: "Waist (cm)", placeholder: "76" },
  { id: "hips", label: "Hips (cm)", placeholder: "100" },
  { id: "sleeveLength", label: "Sleeve Length (cm)", placeholder: "60" },
  { id: "abayaLength", label: "Abaya Length (cm)", placeholder: "140" },
];

const BASE_PRICE = 15000;
const CRAFTING_DAYS = "10–14 business days";

// ---------------------------------------------------------------------------
// Step definitions
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
// Configuration state type
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

// ---------------------------------------------------------------------------
// Price calculation
// ---------------------------------------------------------------------------

function findOption(options: Option[], id: string | null): Option | null {
  if (!id) return null;
  return options.find((o) => o.id === id) || null;
}

function findColor(id: string | null): (Option & { hex: string }) | null {
  if (!id) return null;
  return (COLORS as (Option & { hex: string })[]).find((c) => c.id === id) || null;
}

function calculatePrice(config: CustomConfig): number {
  let total = BASE_PRICE;
  const style = findOption(STYLES, config.style);
  const fabric = findOption(FABRICS, config.fabric);
  const color = findColor(config.color);
  const sleeves = findOption(SLEEVES, config.sleeves);
  const hijab = findOption(HIJAB, config.hijab);
  const embroidery = findOption(EMBROIDERY, config.embroidery);
  if (style) total += style.price;
  if (fabric) total += fabric.price;
  if (color) total += color.price;
  if (sleeves) total += sleeves.price;
  if (hijab) total += hijab.price;
  if (embroidery) total += embroidery.price;
  for (const dId of config.details) {
    const d = findOption(DETAILS, dId);
    if (d) total += d.price;
  }
  return total;
}

function buildSummary(config: CustomConfig): Record<string, string> {
  const summary: Record<string, string> = {};
  const style = findOption(STYLES, config.style);
  const fabric = findOption(FABRICS, config.fabric);
  const color = findColor(config.color);
  const sleeves = findOption(SLEEVES, config.sleeves);
  const hijab = findOption(HIJAB, config.hijab);
  const embroidery = findOption(EMBROIDERY, config.embroidery);
  if (style) summary.Style = style.label;
  if (fabric) summary.Fabric = fabric.label;
  if (color) summary.Color = color.label;
  if (sleeves) summary.Sleeves = sleeves.label;
  if (hijab) summary.Hijab = hijab.label;
  if (embroidery) summary.Embroidery = embroidery.label;
  if (config.details.length > 0) {
    summary.Details = config.details
      .map((d) => findOption(DETAILS, d)?.label)
      .filter(Boolean)
      .join(", ");
  }
  if (config.measurements.abayaLength) {
    summary.Length = `${config.measurements.abayaLength} cm`;
  }
  return summary;
}

// ---------------------------------------------------------------------------
// Reusable option card
// ---------------------------------------------------------------------------

function OptionCard({
  option,
  selected,
  onClick,
  extra,
}: {
  option: Option;
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
          ? "border-[var(--gold)] ring-2 ring-[var(--gold)]/30 bg-[var(--gold)]/5"
          : "border-border hover:border-foreground/30"
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span className="font-serif text-base font-medium">{option.label}</span>
        {selected ? (
          <CheckCircle2 className="size-5 flex-none text-[var(--gold)]" />
        ) : null}
      </div>
      {option.desc ? (
        <span className="text-xs text-muted-foreground">{option.desc}</span>
      ) : null}
      <span
        className={cn(
          "mt-1 text-sm font-medium",
          option.price === 0 ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {option.price === 0 ? "Included" : `+${formatPKR(option.price)}`}
      </span>
      {extra}
    </button>
  );
}

function ColorSwatch({
  color,
  selected,
  onClick,
}: {
  color: Option & { hex: string };
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={color.label}
      className={cn(
        "group flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
        selected
          ? "border-[var(--gold)] ring-2 ring-[var(--gold)]/30 bg-[var(--gold)]/5"
          : "border-border hover:border-foreground/30"
      )}
    >
      <span
        className="size-12 rounded-full ring-1 ring-inset ring-black/10"
        style={{ backgroundColor: color.hex }}
      />
      <span className="text-xs font-medium">{color.label}</span>
      <span
        className={cn(
          "text-[0.65rem]",
          color.price === 0 ? "text-muted-foreground" : "text-[var(--gold)]"
        )}
      >
        {color.price === 0 ? "Included" : `+${formatPKR(color.price)}`}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main builder component
// ---------------------------------------------------------------------------

export function CustomAbayaBuilder() {
  const [stepIdx, setStepIdx] = React.useState(0);
  const [config, setConfig] = React.useState<CustomConfig>(EMPTY_CONFIG);
  const [adding, setAdding] = React.useState(false);
  const addToCart = useCart((s) => s.add);
  const setCartOpen = useUI((s) => s.setCartOpen);

  const currentStep = STEPS[stepIdx];
  const price = calculatePrice(config);
  const summary = buildSummary(config);

  // Navigation
  const next = () => {
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
  };
  const back = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  };
  const goTo = (idx: number) => setStepIdx(idx);

  // Validation per step
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

  // Add to cart
  const onAddToCart = () => {
    setAdding(true);
    const color = findColor(config.color);
    const style = findOption(STYLES, config.style);
    const fabric = findOption(FABRICS, config.fabric);
    const customId = `custom-${Date.now()}`;
    const name = `Custom Abaya — ${style?.label || "Bespoke"}`;
    const measurementsSummary = `Custom (${Object.entries(config.measurements)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ")})`;

    addToCart({
      productId: customId,
      name,
      price,
      image: "/images/custom.jpg",
      color: color?.hex || "#1a1a1a",
      colorName: color?.label || "Custom",
      size: measurementsSummary,
      qty: 1,
    });

    toast.success("Custom abaya added to your bag", {
      description: `${name} · ${formatPKR(price)}`,
    });

    setTimeout(() => {
      setAdding(false);
      setCartOpen(true);
    }, 500);
  };

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Header */}
      <div className="flex flex-col gap-2 text-center">
        <span className="eyebrow text-[var(--gold)]">Bespoke Atelier</span>
        <h1 className="font-serif text-3xl font-medium sm:text-4xl">
          Design Your Own Abaya
        </h1>
        <p className="mx-auto max-w-lg text-sm text-muted-foreground">
          Configure every detail — from fabric to embroidery — and our master
          artisans will craft a piece that is uniquely yours.{" "}
          <span className="font-medium text-foreground">Crafted in {CRAFTING_DAYS}.</span>
        </p>
      </div>

      {/* Layout: sidebar steps + content */}
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
                    ? "border-primary bg-primary text-primary-foreground"
                    : i < stepIdx
                      ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
                      : "border-border text-muted-foreground"
                )}
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
                        ? "border-primary bg-primary text-primary-foreground"
                        : i < stepIdx
                          ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
                          : "border-border"
                    )}
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

        {/* Step content */}
        <div className="min-w-0">
          <StepContent
            step={currentStep.id}
            config={config}
            setConfig={setConfig}
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
              <Sparkles className="size-4 text-[var(--gold)]" />
              <h3 className="eyebrow text-[var(--mocha)]">Live Price</h3>
            </div>
            <p className="mt-3 font-serif text-3xl font-semibold">
              {formatPKR(price)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Base {formatPKR(BASE_PRICE)} + options
            </p>

            <div className="mt-4 space-y-1.5 border-t pt-4 text-sm">
              <PriceLine
                label="Base (bespoke craftsmanship)"
                value={BASE_PRICE}
              />
              {config.style && (
                <PriceLine
                  label={findOption(STYLES, config.style)?.label || "Style"}
                  value={findOption(STYLES, config.style)?.price || 0}
                />
              )}
              {config.fabric && (
                <PriceLine
                  label={findOption(FABRICS, config.fabric)?.label || "Fabric"}
                  value={findOption(FABRICS, config.fabric)?.price || 0}
                />
              )}
              {config.color && (
                <PriceLine
                  label={findColor(config.color)?.label || "Color"}
                  value={findColor(config.color)?.price || 0}
                />
              )}
              {config.sleeves && (
                <PriceLine
                  label={findOption(SLEEVES, config.sleeves)?.label || "Sleeves"}
                  value={findOption(SLEEVES, config.sleeves)?.price || 0}
                />
              )}
              {config.hijab && (
                <PriceLine
                  label={findOption(HIJAB, config.hijab)?.label || "Hijab"}
                  value={findOption(HIJAB, config.hijab)?.price || 0}
                />
              )}
              {config.embroidery && (
                <PriceLine
                  label={findOption(EMBROIDERY, config.embroidery)?.label || "Embroidery"}
                  value={findOption(EMBROIDERY, config.embroidery)?.price || 0}
                />
              )}
              {config.details.map((dId) => {
                const d = findOption(DETAILS, dId);
                return d ? (
                  <PriceLine key={dId} label={d.label} value={d.price} />
                ) : null;
              })}
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <span className="font-serif text-base font-medium">Total</span>
              <span className="font-serif text-xl font-semibold">
                {formatPKR(price)}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
              <Ruler className="size-4 flex-none text-[var(--gold)]" />
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
// Step content renderer
// ---------------------------------------------------------------------------

function StepContent({
  step,
  config,
  setConfig,
}: {
  step: StepId;
  config: CustomConfig;
  setConfig: React.Dispatch<React.SetStateAction<CustomConfig>>;
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
          <div className="grid gap-3 sm:grid-cols-2">
            {STYLES.map((o) => (
              <OptionCard
                key={o.id}
                option={o}
                selected={config.style === o.id}
                onClick={() => setSingle("style")(o.id)}
              />
            ))}
          </div>
        </StepShell>
      );

    case "fabric":
      return (
        <StepShell
          title="Choose Your Fabric"
          desc="The fabric defines how your abaya flows and feels against your skin."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {FABRICS.map((o) => (
              <OptionCard
                key={o.id}
                option={o}
                selected={config.fabric === o.id}
                onClick={() => setSingle("fabric")(o.id)}
              />
            ))}
          </div>
        </StepShell>
      );

    case "color":
      return (
        <StepShell
          title="Choose Your Colour"
          desc="Pick the shade that complements your style."
        >
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {COLORS.map((c) => (
              <ColorSwatch
                key={c.id}
                color={c as Option & { hex: string }}
                selected={config.color === c.id}
                onClick={() => setSingle("color")(c.id)}
              />
            ))}
          </div>
        </StepShell>
      );

    case "sleeves":
      return (
        <StepShell
          title="Choose Your Sleeves"
          desc="From classic cuffs to dramatic bells — sleeves define the character of your abaya."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {SLEEVES.map((o) => (
              <OptionCard
                key={o.id}
                option={o}
                selected={config.sleeves === o.id}
                onClick={() => setSingle("sleeves")(o.id)}
              />
            ))}
          </div>
        </StepShell>
      );

    case "hijab":
      return (
        <StepShell
          title="Choose Your Hijab"
          desc="Complete your look with a coordinating or contrasting headpiece."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {HIJAB.map((o) => (
              <OptionCard
                key={o.id}
                option={o}
                selected={config.hijab === o.id}
                onClick={() => setSingle("hijab")(o.id)}
              />
            ))}
          </div>
        </StepShell>
      );

    case "embroidery":
      return (
        <StepShell
          title="Choose Your Embroidery"
          desc="Hand-embroidered details add a touch of couture to your abaya."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {EMBROIDERY.map((o) => (
              <OptionCard
                key={o.id}
                option={o}
                selected={config.embroidery === o.id}
                onClick={() => setSingle("embroidery")(o.id)}
              />
            ))}
          </div>
        </StepShell>
      );

    case "details":
      return (
        <StepShell
          title="Add Details"
          desc="Optional extras to make your abaya perfectly yours. Select any that appeal."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {DETAILS.map((o) => (
              <OptionCard
                key={o.id}
                option={o}
                selected={config.details.includes(o.id)}
                onClick={() => toggleDetail(o.id)}
              />
            ))}
          </div>
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
      return (
        <ReferenceStep config={config} setConfig={setConfig} />
      );

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
        <ReviewStep config={config} />
      );

    default:
      return null;
  }
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
      toast.error("Image too large", { description: "Please upload an image under 5MB." });
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

function ReviewStep({ config }: { config: CustomConfig }) {
  const price = calculatePrice(config);
  const summary = buildSummary(config);
  const color = findColor(config.color);

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
                    background: `linear-gradient(135deg, ${color?.hex || "#1a1a1a"}15, ${color?.hex || "#1a1a1a"}05)`,
                  }}
                >
                  <div
                    className="size-16 rounded-full ring-2 ring-inset ring-black/10"
                    style={{ backgroundColor: color?.hex || "#1a1a1a" }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {color?.label || "Custom"} abaya preview
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
                Custom Abaya — {findOption(STYLES, config.style)?.label || "Bespoke"}
              </h3>
              <dl className="mt-4 space-y-1.5 text-sm">
                {Object.entries(summary).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium text-right">{v}</dd>
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
                <span className="text-muted-foreground">{f.label.replace(" (cm)", "")}</span>
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
            <h3 className="font-serif text-lg font-medium">Special Instructions</h3>
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
                {formatPKR(price)}
              </p>
            </div>
            <div className="text-right text-sm text-primary-foreground/70">
              <p>Crafted in {CRAFTING_DAYS}</p>
              <p className="mt-1">Free nationwide delivery</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Click <span className="font-medium text-foreground">Add to Bag</span> below to add your custom abaya to your existing cart, then proceed through our secure checkout.
        </p>
      </div>
    </StepShell>
  );
}

export default CustomAbayaBuilder;
