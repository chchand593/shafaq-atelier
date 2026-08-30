"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Star, Quote, CheckCircle2, PenLine, Loader2, ThumbsUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import { useUI } from "@/lib/store";
import { toast } from "sonner";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  helpful: number;
  adminReply: string | null;
  adminReplyAt: string | null;
  createdAt: string;
};

type Distribution = { star: number; count: number }[];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type SortKey = "newest" | "helpful" | "highest" | "lowest";
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "helpful", label: "Most Helpful" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
];

function ReviewCard({ review, productSlug }: { review: Review; productSlug: string }) {
  const [helpful, setHelpful] = React.useState(review.helpful);
  const [voted, setVoted] = React.useState(false);

  const onHelpful = async () => {
    if (voted) return;
    setVoted(true);
    setHelpful((h) => h + 1);
    try {
      await fetch(`/api/reviews/${review.id}/helpful`, { method: "POST" });
    } catch {
      setVoted(false);
      setHelpful((h) => h - 1);
    }
  };

  return (
    <li className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials(review.authorName)}
          </span>
          <div>
            <p className="text-sm font-medium">{review.authorName}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString("en-PK", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        {review.verified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold)]/15 px-2.5 py-1 text-[0.65rem] font-medium text-[var(--gold)]">
            <CheckCircle2 className="size-3" /> Verified Buyer
          </span>
        ) : null}
      </div>
      <div className="mt-3">
        <Stars rating={review.rating} size="size-3.5" />
      </div>
      <h4 className="mt-2 font-serif text-base font-medium">
        {review.title}
      </h4>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {review.body}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onHelpful}
          disabled={voted}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
            voted
              ? "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]"
              : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          )}
        >
          <ThumbsUp className="size-3" />
          Helpful{helpful > 0 ? ` (${helpful})` : ""}
        </button>
      </div>

      {/* Admin reply */}
      {review.adminReply ? (
        <div className="mt-4 rounded-lg border border-[var(--gold)]/20 bg-[var(--gold)]/5 p-4">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[0.6rem] font-semibold text-primary-foreground">
              LM
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--mocha)]">
              ShafaQ Atelier replied
            </span>
            {review.adminReplyAt ? (
              <span className="text-xs text-muted-foreground">
                · {new Date(review.adminReplyAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {review.adminReply}
          </p>
        </div>
      ) : null}
    </li>
  );
}

function Stars({ rating, size = "size-4" }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            size,
            i < Math.round(rating)
              ? "fill-[var(--gold)] text-[var(--gold)]"
              : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = React.useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          className="p-0.5"
        >
          <Star
            className={cn(
              "size-7 transition-colors",
              (hover || value) >= star
                ? "fill-[var(--gold)] text-[var(--gold)]"
                : "text-muted-foreground/40 hover:text-muted-foreground"
            )}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-muted-foreground">
        {value > 0 ? `${value} of 5` : "Tap to rate"}
      </span>
    </div>
  );
}

function ReviewForm({ productSlug }: { productSlug: string }) {
  const { data: session, status } = useSession();
  const { setAuthOpen } = useUI();
  const [rating, setRating] = React.useState(0);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="rounded-xl border bg-secondary/40 p-5 text-center">
        <p className="font-serif text-lg font-medium">Share your experience</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to write a review and help other sisters choose.
        </p>
        <Button
          onClick={() => setAuthOpen(true)}
          className="mt-3 rounded-full px-6"
        >
          Sign in to Review
        </Button>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (!title.trim() || !body.trim()) {
      toast.error("Please add a title and review");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${productSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title, body }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to submit review");
      }
      toast.success("Review submitted", {
        description: "Thank you for sharing your experience.",
      });
      setRating(0);
      setTitle("");
      setBody("");
      // reload reviews
      window.dispatchEvent(new CustomEvent("review-submitted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border bg-card p-5 shadow-sm"
    >
      <p className="font-serif text-lg font-medium">Write a Review</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Signed in as {(session.user as { name?: string })?.name || session.user?.email}
      </p>

      <div className="mt-4">
        <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Your rating
        </span>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Review title
        </span>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarise your experience"
          maxLength={120}
        />
      </label>

      <label className="mt-3 block">
        <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Your review
        </span>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What did you love? How did it fit? Would you recommend it?"
          rows={4}
          maxLength={1000}
        />
      </label>

      <Button
        type="submit"
        disabled={submitting}
        className="mt-4 rounded-full px-6"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Submitting…
          </>
        ) : (
          <>
            <PenLine className="size-4" /> Submit Review
          </>
        )}
      </Button>
    </form>
  );
}

function DistributionBars({
  distribution,
  total,
}: {
  distribution: Distribution;
  total: number;
}) {
  return (
    <div className="space-y-1.5">
      {distribution.map((d) => {
        const pct = total > 0 ? (d.count / total) * 100 : 0;
        return (
          <div key={d.star} className="flex items-center gap-2 text-xs">
            <span className="flex w-10 items-center gap-0.5 text-muted-foreground">
              {d.star} <Star className="size-3 fill-[var(--gold)] text-[var(--gold)]" />
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-[var(--gold)] transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-right tabular-nums text-muted-foreground">
              {d.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ProductReviews({ productSlug }: { productSlug: string }) {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [distribution, setDistribution] = React.useState<Distribution>([]);
  const [average, setAverage] = React.useState(0);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [sort, setSort] = React.useState<SortKey>("newest");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${productSlug}?sort=${sort}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        reviews: Review[];
        distribution: Distribution;
        average: number;
        total: number;
      };
      setReviews(data.reviews);
      setDistribution(data.distribution);
      setAverage(data.average);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [productSlug, sort]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    const handler = () => void load();
    window.addEventListener("review-submitted", handler);
    return () => window.removeEventListener("review-submitted", handler);
  }, [load]);

  return (
    <section className="mt-16 sm:mt-20 lg:mt-24">
      <div className="flex flex-col gap-3">
        <span className="eyebrow text-[var(--mocha)]">Customer Reviews</span>
        <h2 className="font-serif text-2xl font-medium sm:text-3xl">
          What Our Sisters Say
        </h2>
        <div className="gold-rule max-w-[3.5rem]" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Summary column */}
        <div className="space-y-5">
          <div className="rounded-xl border bg-card p-5 text-center shadow-sm">
            <p className="font-serif text-4xl font-semibold">
              {average.toFixed(1)}
            </p>
            <Stars rating={average} size="size-4" />
            <p className="mt-1 text-xs text-muted-foreground">
              Based on {total} {total === 1 ? "review" : "reviews"}
            </p>
          </div>
          <DistributionBars distribution={distribution} total={total} />
        </div>

        {/* Reviews list + form */}
        <div className="space-y-6">
          <ReviewForm productSlug={productSlug} />

          {/* Sort dropdown */}
          {!loading && reviews.length > 0 ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </p>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  aria-label="Sort reviews"
                  className="h-9 appearance-none rounded-full border bg-background pl-3 pr-8 text-xs font-medium outline-none transition-colors hover:border-foreground/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="skeleton-shimmer h-32 rounded-xl border"
                />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center">
              <Quote className="mx-auto size-8 text-muted-foreground/40" />
              <p className="mt-2 font-serif text-lg">No reviews yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Be the first to share your experience with this abaya.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} productSlug={productSlug} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

export default ProductReviews;
