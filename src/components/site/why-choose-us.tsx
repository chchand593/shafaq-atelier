"use client";

import {
  Scissors,
  Leaf,
  Truck,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { WHY_CHOOSE_US, type Feature } from "@/lib/site-data";

const ICONS: Record<Feature["icon"], LucideIcon> = {
  scissors: Scissors,
  leaf: Leaf,
  truck: Truck,
  shield: ShieldCheck,
  heart: ShieldCheck,
  sparkles: ShieldCheck,
};

export function WhyChooseUs() {
  return (
    <section id="about" className="bg-primary text-primary-foreground py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="eyebrow text-[var(--gold-soft)]">
            The ShafaQ Atelier Promise
          </span>
          <h2 className="font-serif text-3xl font-medium leading-tight text-primary-foreground sm:text-4xl lg:text-[2.75rem]">
            Why Women Choose Us
          </h2>
          <div className="gold-rule mt-1 max-w-[3.5rem] opacity-70" />
          <p className="max-w-2xl text-sm leading-relaxed text-primary-foreground/75 sm:text-base">
            We believe modesty and elegance belong together. Every abaya is a
            quiet celebration of the woman who wears it.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_CHOOSE_US.map((feature) => {
            const Icon = ICONS[feature.icon];
            return (
              <div
                key={feature.title}
                className="flex flex-col gap-4 bg-primary p-7 transition-colors hover:bg-primary-foreground/[0.04]"
              >
                <span className="inline-flex size-12 items-center justify-center rounded-full border border-[var(--gold)]/40 text-[var(--gold-soft)]">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-serif text-xl font-medium text-primary-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-primary-foreground/70">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUs;
