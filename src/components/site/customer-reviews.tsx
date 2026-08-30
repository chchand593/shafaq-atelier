"use client";

import { Star, Quote } from "lucide-react";
import { SectionHeader } from "@/components/site/section-header";
import { REVIEWS } from "@/lib/site-data";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function CustomerReviews() {
  return (
    <section id="reviews" className="bg-background py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Words From Our Sisters"
          title="Customer Reviews"
          description="Real stories from the women who wear ShafaQ Atelier. We are honoured to be part of your journey."
        />

        {/* Aggregate rating */}
        <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6">
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="size-5 fill-[var(--gold)] text-[var(--gold)]" />
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
          {REVIEWS.map((review) => (
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
                  “{review.body}”
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

export default CustomerReviews;
