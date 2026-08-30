"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section
      id="home"
      className="relative isolate overflow-hidden bg-secondary"
    >
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/hero.jpg"
          alt="Elegant Pakistani woman wearing a flowing black abaya with subtle gold embroidery"
          className="h-full w-full object-cover object-center"
          fetchPriority="high"
        />
        {/* Gradient overlay for text legibility on both mobile & desktop */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent sm:from-black/30" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[0.7rem] uppercase tracking-[0.25em] text-white backdrop-blur-sm">
            <Sparkles className="size-3.5 text-[var(--gold-soft)]" />
            Premium Pakistani Abayas
          </span>

          <h1 className="mt-5 font-serif text-4xl font-medium leading-[1.05] text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            Your Style,
            <br />
            Your Modesty,
            <br />
            <span className="text-[var(--gold-soft)]">Your Abaya</span>
          </h1>

          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
            Discover elegantly crafted abayas designed for the modern modest
            woman. From everyday essentials to bespoke couture — find the piece
            that speaks to your grace.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-primary px-7 text-sm font-medium uppercase tracking-wider hover:bg-primary/90"
            >
              <a href="/daily-wear">
                Explore Daily Wear Abayas
                <ArrowRight className="ml-1 size-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-white/40 bg-white/5 px-7 text-sm font-medium uppercase tracking-wider text-white backdrop-blur-sm hover:bg-white/15 hover:text-white"
            >
              <a href="/customized-abayas">
                Design Your Own Abaya
              </a>
            </Button>
          </div>

          {/* Trust strip */}
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-4 border-t border-white/20 pt-6 text-white">
            <div>
              <dt className="font-serif text-2xl font-semibold text-[var(--gold-soft)]">
                500+
              </dt>
              <dd className="mt-1 text-[0.7rem] uppercase tracking-wider text-white/70">
                Designs
              </dd>
            </div>
            <div>
              <dt className="font-serif text-2xl font-semibold text-[var(--gold-soft)]">
                12k+
              </dt>
              <dd className="mt-1 text-[0.7rem] uppercase tracking-wider text-white/70">
                Happy Women
              </dd>
            </div>
            <div>
              <dt className="font-serif text-2xl font-semibold text-[var(--gold-soft)]">
                4.9★
              </dt>
              <dd className="mt-1 text-[0.7rem] uppercase tracking-wider text-white/70">
                Avg Rating
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-white/60 sm:flex">
        <span className="text-[0.6rem] uppercase tracking-[0.3em]">Scroll</span>
        <span className="h-8 w-px bg-white/40" />
      </div>
    </section>
  );
}

export default Hero;
