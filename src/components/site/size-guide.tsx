"use client";

import { Ruler } from "lucide-react";
import { SectionHeader } from "@/components/site/section-header";

const SIZES = [
  { size: "XS", bust: "86", waist: "68", hips: "92", length: "135" },
  { size: "S", bust: "90", waist: "72", hips: "96", length: "138" },
  { size: "M", bust: "94", waist: "76", hips: "100", length: "141" },
  { size: "L", bust: "100", waist: "82", hips: "106", length: "144" },
  { size: "XL", bust: "106", waist: "88", hips: "112", length: "147" },
  { size: "XXL", bust: "112", waist: "94", hips: "118", length: "150" },
];

export function SizeGuide() {
  return (
    <section id="size-guide" className="bg-background py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Find Your Fit"
          title="Size Guide"
          description="All measurements are in centimetres. For a flowing everyday fit, we recommend choosing your usual size. For a more relaxed silhouette, size up. Need help? Our team is a message away."
        />

        <div className="mt-10 overflow-hidden rounded-xl border">
          <div className="grid grid-cols-5 bg-secondary px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:px-6">
            <div>Size</div>
            <div className="text-center">Bust</div>
            <div className="text-center">Waist</div>
            <div className="text-center">Hips</div>
            <div className="text-center">Length</div>
          </div>
          <div className="divide-y">
            {SIZES.map((row) => (
              <div
                key={row.size}
                className="grid grid-cols-5 px-4 py-3 text-sm sm:px-6"
              >
                <div className="font-serif font-semibold text-foreground">
                  {row.size}
                </div>
                <div className="text-center text-muted-foreground">{row.bust}</div>
                <div className="text-center text-muted-foreground">{row.waist}</div>
                <div className="text-center text-muted-foreground">{row.hips}</div>
                <div className="text-center text-muted-foreground">
                  {row.length}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <Ruler className="size-4 text-[var(--gold)]" />
          Measurements are of the garment, not the body. Allow ±2cm tolerance.
        </p>
      </div>
    </section>
  );
}

export default SizeGuide;
