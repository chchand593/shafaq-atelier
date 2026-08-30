"use client";

import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    step: "01",
    title: "Choose Your Fabric",
    description:
      "From flowing nida to luxurious crepe — select the base that feels like you.",
  },
  {
    step: "02",
    title: "Design Your Detail",
    description:
      "Embellishments, embroidery, sleeves, length. Every stitch tells your story.",
  },
  {
    step: "03",
    title: "We Craft & Deliver",
    description:
      "Our master artisans tailor your abaya and deliver it to your door.",
  },
];

export function CustomizedAbaya() {
  return (
    <section
      id="customized-abaya"
      className="relative isolate overflow-hidden bg-primary text-primary-foreground"
    >
      <div className="mx-auto grid max-w-7xl items-stretch gap-0 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        {/* Image side */}
        <div className="relative min-h-[360px] overflow-hidden sm:min-h-[460px] lg:min-h-[560px]">
          <img
            src="/images/custom.jpg"
            alt="Artisan embroidering delicate gold thread onto a luxurious black abaya"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/10 to-transparent lg:bg-gradient-to-r" />
        </div>

        {/* Content side */}
        <div className="flex flex-col justify-center py-16 lg:py-24 lg:pl-12">
          <span className="eyebrow text-[var(--gold-soft)]">
            Bespoke Atelier
          </span>
          <h2 className="mt-3 font-serif text-3xl font-medium leading-tight sm:text-4xl lg:text-[2.75rem]">
            Design Your Own Abaya
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
            Bring your vision to life with our bespoke abaya service. Choose
            your fabric, silhouette and embellishments — and our master
            artisans will craft a piece that is uniquely, beautifully yours.
          </p>

          {/* Steps */}
          <ol className="mt-10 space-y-5">
            {STEPS.map((s) => (
              <li key={s.step} className="flex gap-4">
                <span className="flex size-10 flex-none items-center justify-center rounded-full border border-[var(--gold)]/40 font-serif text-sm text-[var(--gold-soft)]">
                  {s.step}
                </span>
                <div>
                  <h3 className="font-serif text-lg font-medium text-primary-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-primary-foreground/70">
                    {s.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-foreground/85">
            {[
              "Free design consultation",
              "Crafted in 10–14 days",
              "Nationwide delivery",
            ].map((item) => (
              <li key={item} className="inline-flex items-center gap-2">
                <Check className="size-4 text-[var(--gold-soft)]" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-9">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-[var(--gold)] px-7 text-sm font-medium uppercase tracking-wider text-primary hover:bg-[var(--gold-soft)]"
            >
              <a href="/customized-abayas">
                Start Your Design
                <ArrowRight className="ml-1 size-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CustomizedAbaya;
