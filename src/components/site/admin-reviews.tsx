"use client";

import * as React from "react";
import { Star, Trash2, Loader2, AlertTriangle, X, Check, Clock, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AdminReview = {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  approved: boolean;
  featured: boolean;
  helpful: number;
  adminReply: string | null;
  adminReplyAt: string | null;
  createdAt: string;
  product: { name: string; slug: string; image: string } | null;
};

type Stats = {
  total: number;
  pending: number;
  approved: number;
  featured: number;
  replied: number;
  unreplied: number;
};

type Filter = "all" | "pending" | "approved" | "featured" | "replied" | "unreplied";

export function AdminReviews() {
  const [reviews, setReviews] = React.useState<AdminReview[]>([]);
  const [stats, setStats] = React.useState<Stats>({
    total: 0, pending: 0, approved: 0, featured: 0, replied: 0, unreplied: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);
  const [replyId, setReplyId] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?filter=${filter}`);
      const d = (await res.json()) as { reviews: AdminReview[]; stats: Stats };
      setReviews(d.reviews || []);
      if (d.stats) setStats(d.stats);
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const deleteReview = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Review deleted");
      setDeleteConfirm(null);
      void load();
    } catch {
      toast.error("Failed to delete review");
    }
  };

  // Fix #4: patchReview calls PATCH /api/admin/reviews/[id] with
  // { approved?, featured? } to approve/reject/feature a review.
  const patchReview = async (id: string, patch: { approved?: boolean; featured?: boolean }) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      const action = patch.approved !== undefined
        ? (patch.approved ? "Approved" : "Unpublished")
        : (patch.featured ? "Featured" : "Unfeatured");
      toast.success(`${action} review`);
      void load();
    } catch {
      toast.error("Failed to update review");
    }
  };

  const saveReply = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}/reply`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText }),
      });
      if (!res.ok) throw new Error();
      toast.success("Reply saved");
      setReplyId(null);
      setReplyText("");
      void load();
    } catch {
      toast.error("Failed to save reply");
    }
  };

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: stats.total },
    { key: "pending", label: "Pending", count: stats.pending },
    { key: "approved", label: "Approved", count: stats.approved },
    { key: "featured", label: "Featured", count: stats.featured },
    { key: "unreplied", label: "Unreplied", count: stats.unreplied },
    { key: "replied", label: "Replied", count: stats.replied },
  ];

  return (
    <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <span className="eyebrow text-[var(--gold)]">Review Moderation</span>
        <h1 className="font-serif text-2xl font-medium sm:text-3xl">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Approve reviews to make them public on the storefront. Feature the
          best ones to highlight them.
        </p>
      </div>

      {/* Filter tabs with counts */}
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all",
              filter === f.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-foreground/30"
            )}
          >
            {f.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-[0.6rem]",
                filter === f.key ? "bg-primary-foreground/20" : "bg-secondary"
              )}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed py-12 text-center">
          <Star className="mx-auto mb-3 size-8 opacity-40" />
          <p className="text-sm text-muted-foreground">No reviews in this filter.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className={cn(
                "rounded-xl border bg-card p-5 shadow-sm",
                !r.approved && "border-amber-300/50 bg-amber-50/30"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{r.authorName}</span>
                    {r.verified ? (
                      <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[0.6rem] font-medium text-green-700">
                        Verified Buyer
                      </span>
                    ) : null}
                    {r.approved ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[0.6rem] font-medium text-green-700">
                        <Check className="size-2.5" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.6rem] font-medium text-amber-700">
                        <Clock className="size-2.5" /> Pending
                      </span>
                    )}
                    {r.featured ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold)]/15 px-2 py-0.5 text-[0.6rem] font-medium text-[var(--gold)]">
                        <Star className="size-2.5 fill-current" /> Featured
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "size-3.5",
                          i < r.rating ? "fill-[var(--gold)] text-[var(--gold)]" : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-2 font-serif text-sm font-medium">{r.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {r.product?.name || "Unknown product"} ·{" "}
                    {new Date(r.createdAt).toLocaleDateString("en-PK")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {/* Approve / Unpublish */}
                  <button
                    type="button"
                    onClick={() => patchReview(r.id, { approved: !r.approved })}
                    className={cn(
                      "inline-flex size-8 items-center justify-center rounded-md transition-colors",
                      r.approved
                        ? "bg-green-500/15 text-green-700 hover:bg-green-500/25"
                        : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"
                    )}
                    aria-label={r.approved ? "Unpublish review" : "Approve review"}
                    title={r.approved ? "Unpublish" : "Approve & publish"}
                  >
                    {r.approved ? <Check className="size-4" /> : <Clock className="size-4" />}
                  </button>
                  {/* Feature / Unfeature */}
                  <button
                    type="button"
                    onClick={() => patchReview(r.id, { featured: !r.featured })}
                    className={cn(
                      "inline-flex size-8 items-center justify-center rounded-md transition-colors",
                      r.featured
                        ? "bg-[var(--gold)]/20 text-[var(--gold)]"
                        : "text-muted-foreground hover:bg-secondary"
                    )}
                    aria-label={r.featured ? "Unfeature review" : "Feature review"}
                    title={r.featured ? "Unfeature" : "Feature"}
                  >
                    <Star className={cn("size-4", r.featured && "fill-current")} />
                  </button>
                  {/* Reply */}
                  <button
                    type="button"
                    onClick={() => { setReplyId(r.id); setReplyText(r.adminReply || ""); }}
                    className={cn(
                      "inline-flex size-8 items-center justify-center rounded-md transition-colors",
                      r.adminReply
                        ? "bg-blue-500/15 text-blue-700"
                        : "text-muted-foreground hover:bg-secondary"
                    )}
                    aria-label="Reply to review"
                    title={r.adminReply ? "Edit reply" : "Reply"}
                  >
                    <MessageCircle className="size-4" />
                  </button>
                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(r.id)}
                    className="inline-flex size-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                    aria-label="Delete review"
                    title="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {/* Admin reply */}
              {r.adminReply ? (
                <div className="mt-3 rounded-lg border bg-secondary/30 p-3 text-sm">
                  <p className="eyebrow text-[var(--mocha)]">Admin Reply</p>
                  <p className="mt-1">{r.adminReply}</p>
                </div>
              ) : null}

              {/* Reply editor */}
              {replyId === r.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply…"
                    rows={2}
                    className="w-full rounded-lg border bg-background p-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveReply(r.id)}
                      className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground"
                    >
                      Save Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => { setReplyId(null); setReplyText(""); }}
                      className="rounded-full border px-4 py-1.5 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-sm rounded-xl border bg-card p-6 text-center shadow-lg">
            <AlertTriangle className="mx-auto size-10 text-destructive" />
            <h3 className="mt-3 font-serif text-lg font-medium">Delete this review?</h3>
            <p className="mt-1 text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-full border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteReview(deleteConfirm)}
                className="flex-1 rounded-full bg-destructive px-4 py-2 text-sm text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AdminReviews;
