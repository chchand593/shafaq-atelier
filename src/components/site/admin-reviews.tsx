"use client";

import * as React from "react";
import { Star, Trash2, Loader2, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AdminReview = {
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
  product: { name: string; slug: string; image: string } | null;
};

export function AdminReviews() {
  const [reviews, setReviews] = React.useState<AdminReview[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("all");
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);
  const [replyId, setReplyId] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews");
      const d = (await res.json()) as { reviews: AdminReview[] };
      setReviews(d.reviews || []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = reviews.filter((r) => {
    if (filter === "replied") return r.adminReply !== null;
    if (filter === "unreplied") return r.adminReply === null;
    return true;
  });

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

  return (
    <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <span className="eyebrow text-[var(--gold)]">Review Moderation</span>
        <h1 className="font-serif text-2xl font-medium sm:text-3xl">Reviews</h1>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["all", "unreplied", "replied"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all",
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-foreground/30"
            )}
          >
            {f === "all" ? "All Reviews" : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">No reviews found.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.authorName}</span>
                    {r.verified ? (
                      <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[0.6rem] font-medium text-green-700">
                        Verified
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
                    {r.product?.name || "Unknown product"} · {new Date(r.createdAt).toLocaleDateString("en-PK")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(r.id)}
                    className="inline-flex size-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                    aria-label="Delete review"
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
              ) : replyId === r.id ? (
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
              ) : (
                <button
                  type="button"
                  onClick={() => { setReplyId(r.id); setReplyText(r.adminReply || ""); }}
                  className="mt-3 text-xs text-[var(--gold)] hover:underline"
                >
                  Reply to this review
                </button>
              )}
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
