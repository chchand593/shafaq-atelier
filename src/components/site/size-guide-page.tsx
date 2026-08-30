"use client";

import Link from "next/link";
import {
  Ruler,
  ArrowRight,
  Sparkles,
  Check,
  Info,
  User,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ---------------------------------------------------------------------------
// Size chart data (matching existing homepage SizeGuide component)
// ---------------------------------------------------------------------------

const SIZE_CHART = [
  { size: "XS", bust: "86", waist: "68", hips: "92", shoulder: "36", sleeve: "56", height: "155–160" },
  { size: "S",  bust: "90", waist: "72", hips: "96", shoulder: "37", sleeve: "58", height: "160–165" },
  { size: "M",  bust: "94", waist: "76", hips: "100", shoulder: "38", sleeve: "60", height: "165–170" },
  { size: "L",  bust: "100", waist: "82", hips: "106", shoulder: "39", sleeve: "62", height: "170–175" },
  { size: "XL", bust: "106", waist: "88", hips: "112", shoulder: "40", sleeve: "64", height: "175–180" },
  { size: "XXL", bust: "112", waist: "94", hips: "118", shoulder: "41", sleeve: "66", height: "180–185" },
];

// ---------------------------------------------------------------------------
// 1. Premium Hero
// ---------------------------------------------------------------------------

function SizeGuideHero() {
  return (
    <section className="bg-secondary py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <span className="eyebrow text-[var(--gold)]">Find Your Perfect Fit</span>
        <h1 className="mt-3 font-serif text-4xl font-medium leading-tight sm:text-5xl">
          Size Guide
        </h1>
        <div className="gold-rule mx-auto mt-3 max-w-[3.5rem]" />
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
          Use our measurement guide to find the abaya size that feels
          comfortable, elegant and made for you.
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. Ready-to-Wear Size Chart
// ---------------------------------------------------------------------------

function SizeChart() {
  const headers = ["Size", "Bust", "Waist", "Hips", "Shoulder", "Sleeve", "Rec. Height"];
  return (
    <section className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="eyebrow text-[var(--mocha)]">Ready-to-Wear</span>
          <h2 className="font-serif text-3xl font-medium sm:text-4xl">
            Size Chart
          </h2>
          <p className="max-w-lg text-sm text-muted-foreground">
            All measurements are in centimetres and represent guide
            measurements of the garment, not guaranteed body measurements.
            Allow &plusmn;2cm tolerance.
          </p>
        </div>

        {/* Desktop table */}
        <div className="mt-10 hidden overflow-hidden rounded-xl border sm:block">
          <div className="grid grid-cols-7 bg-secondary px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {headers.map((h) => (
              <div key={h} className={h === "Size" ? "" : "text-center"}>
                {h}
              </div>
            ))}
          </div>
          <div className="divide-y">
            {SIZE_CHART.map((row) => (
              <div key={row.size} className="grid grid-cols-7 px-4 py-3 text-sm">
                <div className="font-serif font-semibold text-foreground">
                  {row.size}
                </div>
                <div className="text-center text-muted-foreground">{row.bust}</div>
                <div className="text-center text-muted-foreground">{row.waist}</div>
                <div className="text-center text-muted-foreground">{row.hips}</div>
                <div className="text-center text-muted-foreground">{row.shoulder}</div>
                <div className="text-center text-muted-foreground">{row.sleeve}</div>
                <div className="text-center text-muted-foreground">{row.height}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: horizontally scrollable table */}
        <div className="mt-10 overflow-x-auto elegant-scroll sm:hidden">
          <table className="w-full min-w-[500px] border-collapse">
            <thead>
              <tr className="bg-secondary text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {headers.map((h) => (
                  <th key={h} className="px-3 py-3 text-left first:text-left text-center">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {SIZE_CHART.map((row) => (
                <tr key={row.size} className="text-sm">
                  <td className="px-3 py-3 font-serif font-semibold text-foreground">
                    {row.size}
                  </td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{row.bust}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{row.waist}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{row.hips}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{row.shoulder}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{row.sleeve}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{row.height}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3. How to Measure
// ---------------------------------------------------------------------------

const MEASURE_STEPS = [
  { icon: User, title: "Height", desc: "Stand barefoot against a wall. Measure from the top of your head to the floor." },
  { icon: Ruler, title: "Bust", desc: "Measure around the fullest part of your bust, keeping the tape level across your back." },
  { icon: Ruler, title: "Waist", desc: "Measure around your natural waistline — the narrowest part of your torso." },
  { icon: Ruler, title: "Hips", desc: "Measure around the fullest part of your hips, approximately 20cm below your waist." },
  { icon: Ruler, title: "Sleeve Length", desc: "Measure from the shoulder seam down to your wrist, with your arm slightly bent." },
  { icon: Ruler, title: "Abaya Length", desc: "Measure from the highest point of your shoulder to your desired hem length." },
];

function HowToMeasure() {
  return (
    <section className="bg-secondary/40 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="eyebrow text-[var(--gold)]">Step by Step</span>
          <h2 className="font-serif text-3xl font-medium sm:text-4xl">
            How to Measure
          </h2>
          <div className="gold-rule max-w-[3.5rem]" />
          <p className="max-w-lg text-sm text-muted-foreground">
            Use a soft measuring tape and wear lightweight clothing for the most
            accurate results. Stand naturally and keep the tape snug, not tight.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MEASURE_STEPS.map((step, i) => (
            <div
              key={step.title}
              className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full border border-[var(--gold)]/40 font-serif text-sm font-medium text-[var(--gold)]">
                  {i + 1}
                </span>
                <h3 className="font-serif text-lg font-medium">{step.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 4. Abaya Length Guide
// ---------------------------------------------------------------------------

const LENGTH_OPTIONS = [
  {
    title: "Regular Length",
    range: "135–140 cm",
    desc: "Falls just above the ankle. Perfect for everyday wear and ease of movement.",
  },
  {
    title: "Ankle Length",
    range: "140–145 cm",
    desc: "Reaches the ankle for full coverage while remaining practical for daily activities.",
  },
  {
    title: "Full Length",
    range: "145–155 cm",
    desc: "Drapes to the floor for maximum elegance — ideal for special occasions and formal wear.",
  },
];

function LengthGuide() {
  return (
    <section className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="eyebrow text-[var(--mocha)]">Choose Your Length</span>
          <h2 className="font-serif text-3xl font-medium sm:text-4xl">
            Abaya Length Guide
          </h2>
          <div className="gold-rule max-w-[3.5rem]" />
          <p className="max-w-lg text-sm text-muted-foreground">
            Choose your abaya length based on your height and how you prefer
            your abaya to drape.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {LENGTH_OPTIONS.map((opt) => (
            <div
              key={opt.title}
              className="flex flex-col gap-3 rounded-xl border bg-card p-6 text-center shadow-sm"
            >
              <h3 className="font-serif text-xl font-medium">{opt.title}</h3>
              <span className="inline-flex items-center justify-center rounded-full bg-[var(--gold)]/15 px-3 py-1 text-xs font-medium text-[var(--gold)]">
                {opt.range}
              </span>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {opt.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 5. Customized Abaya Measurements
// ---------------------------------------------------------------------------

const CUSTOM_MEASUREMENTS = [
  "Height",
  "Bust",
  "Waist",
  "Hips",
  "Sleeve Length",
  "Abaya Length",
];

function CustomMeasurements() {
  return (
    <section className="bg-secondary/40 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-5 rounded-2xl border bg-card p-8 text-center shadow-sm sm:p-10">
          <span className="flex size-14 items-center justify-center rounded-full border border-[var(--gold)]/40 text-[var(--gold)]">
            <Sparkles className="size-6" />
          </span>
          <h2 className="font-serif text-2xl font-medium sm:text-3xl">
            Customized Abaya Measurements
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            For a perfectly tailored fit, our Custom Abaya Builder lets you
            enter your own measurements. You&rsquo;ll need to provide:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {CUSTOM_MEASUREMENTS.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium"
              >
                <Check className="size-3 text-[var(--gold)]" />
                {m}
              </span>
            ))}
          </div>
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-[var(--gold)] px-7 text-sm font-medium uppercase tracking-wider text-primary hover:bg-[var(--gold-soft)]"
          >
            <Link href="/customized-abayas">
              Design Your Own Abaya
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 6. Fit Guidance
// ---------------------------------------------------------------------------

const FIT_OPTIONS = [
  {
    title: "Relaxed Fit",
    desc: "Comfortable everyday silhouette with room to move.",
  },
  {
    title: "Regular Fit",
    desc: "Balanced fit for everyday elegance.",
  },
  {
    title: "Flowing Fit",
    desc: "Extra ease for a graceful, flowing silhouette.",
  },
];

function FitGuidance() {
  return (
    <section className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="eyebrow text-[var(--gold)]">Fit Preferences</span>
          <h2 className="font-serif text-3xl font-medium sm:text-4xl">
            Fit Guidance
          </h2>
          <div className="gold-rule max-w-[3.5rem]" />
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {FIT_OPTIONS.map((fit) => (
            <div
              key={fit.title}
              className="flex flex-col gap-3 rounded-xl border bg-card p-6 text-center shadow-sm"
            >
              <h3 className="font-serif text-xl font-medium">{fit.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {fit.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 7. Important Note
// ---------------------------------------------------------------------------

function ImportantNote() {
  return (
    <section className="bg-secondary/40 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-4 rounded-xl border bg-card p-6 shadow-sm">
          <span className="flex size-10 flex-none items-center justify-center rounded-full bg-[var(--gold)]/15 text-[var(--gold)]">
            <Info className="size-5" />
          </span>
          <div>
            <h3 className="font-serif text-lg font-medium">Important Note</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Measurements are provided as a general guide. For the best fit,
              measure yourself carefully and compare your measurements with the
              chart before ordering. If you are between sizes, we recommend
              sizing up for a more relaxed silhouette.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 8. FAQ
// ---------------------------------------------------------------------------

const FAQS = [
  {
    q: "What if I am between two sizes?",
    a: "We recommend sizing up for a more relaxed, flowing fit. Our abayas are designed to drape beautifully, and a slightly looser fit is often more comfortable for everyday wear.",
  },
  {
    q: "How should I measure bust and hips?",
    a: "For bust, measure around the fullest part with the tape level across your back. For hips, measure around the fullest part approximately 20cm below your waist. Use a soft tape and keep it snug, not tight.",
  },
  {
    q: "Can I request a custom length?",
    a: "Yes! Our Custom Abaya Builder lets you specify your exact abaya length along with all other measurements. Your abaya will be tailored precisely to your specifications.",
    link: { label: "Design Your Own Abaya", href: "/customized-abayas" },
  },
  {
    q: "Can I customize my abaya measurements?",
    a: "Absolutely. The Custom Abaya Builder allows you to enter your own height, bust, waist, hips, sleeve length and abaya length for a perfectly tailored piece.",
    link: { label: "Start Customizing", href: "/customized-abayas" },
  },
  {
    q: "What if I need help choosing my size?",
    a: "Our team is happy to help you find the perfect fit. Reach out to us via WhatsApp, email, or the contact form and we will guide you through the measuring process.",
    link: { label: "Contact Us", href: "/contact" },
  },
];

function FAQ() {
  return (
    <section className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="eyebrow text-[var(--gold)]">Quick Answers</span>
          <h2 className="font-serif text-3xl font-medium sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <div className="gold-rule max-w-[3.5rem]" />
        </div>
        <Accordion type="single" collapsible className="mt-8 w-full">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-sm font-medium sm:text-base">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                <p className="leading-relaxed">{faq.a}</p>
                {faq.link ? (
                  <Link
                    href={faq.link.href}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--gold)] hover:underline"
                  >
                    {faq.link.label}
                    <ArrowRight className="size-3" />
                  </Link>
                ) : null}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 9. Final CTA
// ---------------------------------------------------------------------------

function FinalCTA() {
  return (
    <section className="bg-primary py-20 text-primary-foreground sm:py-24 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <span className="eyebrow text-[var(--gold-soft)]">We&rsquo;re Here to Help</span>
        <h2 className="mt-3 font-serif text-3xl font-medium sm:text-4xl">
          Still Not Sure About Your Size?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-primary-foreground/75 sm:text-base">
          Our team can guide you through the measuring process, or you can
          design an abaya made entirely to your measurements.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-[var(--gold)] px-7 text-sm font-medium uppercase tracking-wider text-primary hover:bg-[var(--gold-soft)]"
          >
            <Link href="/contact">
              <Mail className="size-4" />
              Contact Us
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 rounded-full border-primary-foreground/40 bg-transparent px-7 text-sm font-medium uppercase tracking-wider text-primary-foreground hover:bg-primary-foreground hover:text-primary"
          >
            <Link href="/customized-abayas">
              <Sparkles className="size-4" />
              Design Your Own Abaya
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main Size Guide page
// ---------------------------------------------------------------------------

export function SizeGuidePage() {
  return (
    <div className="flex flex-col">
      <SizeGuideHero />
      <SizeChart />
      <HowToMeasure />
      <LengthGuide />
      <CustomMeasurements />
      <FitGuidance />
      <ImportantNote />
      <FAQ />
      <FinalCTA />
    </div>
  );
}

export default SizeGuidePage;
