"use client";

import { Instagram, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Reuse existing product imagery for the lookbook tiles.
const TILES = [
  { src: "/images/hero.jpg", label: "The Signature", tag: "@shafaqatelier" },
  { src: "/images/best-1.jpg", label: "Bell-Sleeve Edit", tag: "#RaniaAbaya" },
  { src: "/images/new-1.jpg", label: "Gold-Trim Moments", tag: "#ZaraAbaya" },
  { src: "/images/daily-2.jpg", label: "Everyday Mocha", tag: "#SaharAbaya" },
  { src: "/images/best-2.jpg", label: "Open-Front Styling", tag: "#YasminAbaya" },
  { src: "/images/custom.jpg", label: "Behind the Seams", tag: "#Bespoke" },
];

export function Lookbook() {
  return (
    <section id="lookbook" className="bg-secondary/40 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="eyebrow text-[var(--gold)]">#ShafaQAtelier</span>
          <h2 className="font-serif text-3xl font-medium leading-tight sm:text-4xl lg:text-[2.5rem]">
            Styled by Our Sisters
          </h2>
          <div className="gold-rule mt-1 max-w-[3.5rem]" />
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Real women, real moments. Tag us in your abaya looks to be featured
            in our lookbook and inspire the community.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {TILES.map((tile, i) => (
            <a
              key={i}
              href="#instagram"
              className="zoom-wrap group relative aspect-[4/5] overflow-hidden rounded-lg border bg-secondary"
              aria-label={`View ${tile.label} on Instagram`}
            >
              <img
                src={tile.src}
                alt={tile.label}
                loading="lazy"
                className="zoom-img h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="font-serif text-sm font-medium text-white">
                  {tile.label}
                </p>
                <p className="text-[0.7rem] text-white/70">{tile.tag}</p>
              </div>
              <span className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-white/85 text-foreground opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <Instagram className="size-3.5" />
              </span>
            </a>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full px-6 text-sm font-medium uppercase tracking-wider hover:border-[var(--gold)] hover:text-[var(--gold)]"
          >
            <a href="#instagram">
              <Instagram className="size-4" />
              Follow @shafaqatelier
              <ArrowRight className="ml-1 size-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default Lookbook;
