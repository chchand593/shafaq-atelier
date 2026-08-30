"use client";

import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Heart,
  Award,
  Feather,
  Palette,
  Scissors,
  ShoppingBag,
  Quote,
  Star,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/site/section-header";
import { REVIEWS } from "@/lib/site-data";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// 1. Premium About Hero
// ---------------------------------------------------------------------------

function AboutHero() {
  return (
    <section className="relative isolate overflow-hidden bg-secondary">
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/hero.jpg"
          alt="Elegant Pakistani woman wearing a flowing black abaya with subtle gold embroidery"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[0.7rem] uppercase tracking-[0.25em] text-white backdrop-blur-sm">
            <Sparkles className="size-3.5 text-[var(--gold-soft)]" />
            Our Story
          </span>
          <h1 className="mt-5 font-serif text-4xl font-medium leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            Where Modesty Meets
            <br />
            <span className="text-[var(--gold-soft)]">Your Style</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
            ShafaQ Atelier was born from a simple belief — that modesty and
            elegance belong together. We craft premium Pakistani abayas for the
            woman who dresses with intention, grace and quiet confidence.
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. Brand Story
// ---------------------------------------------------------------------------

function BrandStory() {
  return (
    <section className="bg-background py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Image */}
          <div className="relative overflow-hidden rounded-2xl">
            <div className="aspect-[4/5] w-full bg-secondary sm:aspect-[3/4]">
              <img
                src="/images/custom.jpg"
                alt="Artisan hands embroidering delicate gold thread onto a luxurious abaya"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Text */}
          <div className="flex flex-col gap-4">
            <span className="eyebrow text-[var(--gold)]">Our Journey</span>
            <h2 className="font-serif text-3xl font-medium leading-tight sm:text-4xl">
              Designed for the Modern Modest Woman
            </h2>
            <div className="gold-rule max-w-[3.5rem]" />
            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p>
                ShafaQ Atelier creates elegant Pakistani abayas for everyday wear
                and special occasions. We believe that modesty should never
                mean compromising on comfort, quality or personal style.
              </p>
              <p>
                Each abaya in our collection is thoughtfully designed — from the
                flow of the fabric to the placement of every seam. We source
                only premium crepes, nidas and chiffons, and our master artisans
                bring decades of tailoring experience to every piece.
              </p>
              <p>
                Whether you seek a simple everyday abaya or a bespoke creation
                designed entirely around you, ShafaQ Atelier is here to help you
                dress with grace — your style, your modesty, your abaya.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3. Our Philosophy
// ---------------------------------------------------------------------------

const PHILOSOPHY = [
  {
    icon: Heart,
    title: "Modesty",
    desc: "Timeless silhouettes designed with modesty at heart.",
  },
  {
    icon: Award,
    title: "Quality",
    desc: "Thoughtfully selected fabrics and careful finishing.",
  },
  {
    icon: Feather,
    title: "Comfort",
    desc: "Designed to move beautifully with your everyday life.",
  },
  {
    icon: Palette,
    title: "Personal Style",
    desc: "Because your abaya should reflect you.",
  },
];

function Philosophy() {
  return (
    <section className="bg-secondary/40 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="What We Believe"
          title="Our Philosophy"
          description="Four principles that guide every abaya we create."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PHILOSOPHY.map((item) => (
            <div
              key={item.title}
              className="card-lift flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center shadow-sm"
            >
              <span className="flex size-12 items-center justify-center rounded-full border border-[var(--gold)]/40 text-[var(--gold)]">
                <item.icon className="size-5" />
              </span>
              <h3 className="font-serif text-lg font-medium">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 4. Why ShafaQ Atelier (dark section)
// ---------------------------------------------------------------------------

const BENEFITS = [
  {
    icon: Award,
    title: "Premium Fabrics",
    desc: "We source only the finest crepes, nidas, chiffons and silk blends — breathable, flowing and built to last.",
  },
  {
    icon: Palette,
    title: "Thoughtful Design",
    desc: "Every silhouette is considered — from the drape to the cuff detail — so your abaya feels as good as it looks.",
  },
  {
    icon: Scissors,
    title: "Pakistani Craftsmanship",
    desc: "Our master artisans bring decades of tailoring experience to every piece, honouring a rich heritage of modest fashion.",
  },
  {
    icon: Heart,
    title: "Made for You",
    desc: "Whether off-the-rack or fully bespoke, each abaya is crafted to help you feel confident, comfortable and yourself.",
  },
];

function WhyShafaQAtelier() {
  return (
    <section className="bg-primary py-20 text-primary-foreground sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="eyebrow text-[var(--gold-soft)]">
            The ShafaQ Atelier Difference
          </span>
          <h2 className="font-serif text-3xl font-medium leading-tight sm:text-4xl">
            Why ShafaQ Atelier
          </h2>
          <div className="gold-rule mt-1 max-w-[3.5rem] opacity-70" />
        </div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="flex flex-col gap-4 bg-primary p-7 transition-colors hover:bg-primary-foreground/[0.04]"
            >
              <span className="flex size-12 items-center justify-center rounded-full border border-[var(--gold)]/40 text-[var(--gold-soft)]">
                <b.icon className="size-5" />
              </span>
              <h3 className="font-serif text-xl font-medium text-primary-foreground">
                {b.title}
              </h3>
              <p className="text-sm leading-relaxed text-primary-foreground/70">
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 5. Customized Abaya Highlight
// ---------------------------------------------------------------------------

function CustomHighlight() {
  return (
    <section className="bg-background py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Text */}
          <div className="order-2 flex flex-col gap-4 lg:order-1">
            <span className="eyebrow text-[var(--gold)]">Bespoke Atelier</span>
            <h2 className="font-serif text-3xl font-medium leading-tight sm:text-4xl">
              Your Abaya, Your Way
            </h2>
            <div className="gold-rule max-w-[3.5rem]" />
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Design your own abaya from the ground up. Choose your style,
              fabric, colour, sleeves, hijab, embroidery and details — then
              provide your measurements for a piece tailored entirely around
              you. Our master artisans will craft it with care in 10–14 days.
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/85">
              {[
                "14-step design process",
                "Live price calculation",
                "Premium fabric options",
                "Hand-embroidered details",
                "Made to your measurements",
              ].map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <Check className="size-4 text-[var(--gold)]" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-4">
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

          {/* Image */}
          <div className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-2xl">
              <div className="aspect-[4/5] w-full bg-secondary sm:aspect-[3/4]">
                <img
                  src="/images/custom.jpg"
                  alt="Artisan crafting a bespoke abaya with gold embroidery"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 6. Our Promise
// ---------------------------------------------------------------------------

const PROMISES = [
  "Quality you can feel",
  "Modesty you can trust",
  "Style you can make your own",
  "Service you can rely on",
];

function OurPromise() {
  return (
    <section className="bg-secondary/40 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <span className="eyebrow text-[var(--gold)]">Our Commitment</span>
        <h2 className="mt-3 font-serif text-3xl font-medium sm:text-4xl">
          Our Promise
        </h2>
        <div className="gold-rule mx-auto mt-3 max-w-[3.5rem]" />
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
          Every ShafaQ Atelier abaya carries our promise — to deliver elegance,
          comfort and care in every stitch, and to treat every customer as part
          of our community.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {PROMISES.map((p) => (
            <div
              key={p}
              className="flex items-center gap-3 rounded-xl border bg-card p-5 text-left shadow-sm"
            >
              <span className="flex size-10 flex-none items-center justify-center rounded-full bg-[var(--gold)]/15 text-[var(--gold)]">
                <Check className="size-5" />
              </span>
              <span className="font-serif text-lg font-medium">{p}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 7. Customer Trust (reuses existing REVIEWS data)
// ---------------------------------------------------------------------------

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function CustomerTrust() {
  return (
    <section className="bg-background py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Words From Our Sisters"
          title="Customer Reviews"
          description="Real stories from the women who wear ShafaQ Atelier."
        />
        <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6">
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                className="size-5 fill-[var(--gold)] text-[var(--gold)]"
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-serif text-lg font-semibold text-foreground">
              4.9
            </span>{" "}
            average from 2,400+ verified reviews
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REVIEWS.slice(0, 4).map((review) => (
            <figure
              key={review.id}
              className="card-lift flex flex-col gap-5 rounded-xl border bg-card p-6 shadow-sm"
            >
              <Quote className="size-7 text-[var(--gold)]" />
              <div className="flex items-center gap-1">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="size-3.5 fill-[var(--gold)] text-[var(--gold)]"
                  />
                ))}
              </div>
              <blockquote className="flex-1">
                <p className="font-serif text-lg font-medium leading-snug text-foreground">
                  {review.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{review.body}&rdquo;
                </p>
              </blockquote>
              <figcaption className="flex items-center gap-3 border-t pt-4">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary font-serif text-sm font-semibold text-primary-foreground">
                  {initials(review.name)}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {review.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {review.location} · {review.product}
                  </span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 8. Final CTA
// ---------------------------------------------------------------------------

function FinalCTA() {
  return (
    <section className="bg-primary py-20 text-primary-foreground sm:py-24 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <span className="eyebrow text-[var(--gold-soft)]">Begin Your Journey</span>
        <h2 className="mt-3 font-serif text-3xl font-medium sm:text-4xl lg:text-[2.75rem]">
          Find Your Perfect Abaya
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-primary-foreground/75 sm:text-base">
          Explore our daily wear collection or design something entirely your
          own. Your style, your modesty, your abaya.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-[var(--gold)] px-7 text-sm font-medium uppercase tracking-wider text-primary hover:bg-[var(--gold-soft)]"
          >
            <Link href="/daily-wear">
              <ShoppingBag className="size-4" />
              Shop Daily Wear
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
              Design Your Own
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main About page
// ---------------------------------------------------------------------------

export function AboutPage() {
  return (
    <div className="flex flex-col">
      <AboutHero />
      <BrandStory />
      <Philosophy />
      <WhyShafaQAtelier />
      <CustomHighlight />
      <OurPromise />
      <CustomerTrust />
      <FinalCTA />
    </div>
  );
}

export default AboutPage;
