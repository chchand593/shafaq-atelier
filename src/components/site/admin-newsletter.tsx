"use client";

import * as React from "react";
import { Mail, Download, Search, Trash2, UserX, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  active: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
};

type Stats = { total: number; active: number; unsubscribed: number };

type Filter = "all" | "active" | "unsubscribed";

export function AdminNewsletter() {
  const [subs, setSubs] = React.useState<Subscriber[]>([]);
  const [stats, setStats] = React.useState<Stats>({ total: 0, active: 0, unsubscribed: 0 });
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const activeParam = filter === "all" ? "" : `&active=${filter === "active"}`;
      const qParam = query ? `&q=${encodeURIComponent(query)}` : "";
      const res = await fetch(`/api/admin/newsletter?limit=500${activeParam}${qParam}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as {
        subscribers: Subscriber[];
        stats: Stats;
      };
      setSubs(data.subscribers);
      setStats(data.stats);
    } catch {
      toast.error("Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  }, [filter, query]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Debounced search
  React.useEffect(() => {
    const t = setTimeout(() => void load(), 300);
    return () => clearTimeout(t);
  }, [query, load]);

  const onUnsubscribe = async (id: string, email: string) => {
    if (!confirm(`Unsubscribe ${email}? They will stop receiving emails but remain in the list for audit.`)) return;
    try {
      const res = await fetch(`/api/admin/newsletter?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Unsubscribed", { description: email });
      void load();
    } catch {
      toast.error("Failed to unsubscribe");
    }
  };

  const onHardDelete = async (id: string, email: string) => {
    if (!confirm(`Permanently DELETE ${email}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/newsletter?id=${id}&hard=true`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Deleted", { description: email });
      void load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const activeParam = filter === "all" ? "" : `&active=${filter === "active"}`;
      const qParam = query ? `&q=${encodeURIComponent(query)}` : "";
      const res = await fetch(`/api/admin/newsletter/export?${activeParam}${qParam}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shafaq-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("CSV exported", { description: `${subs.length} subscribers` });
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: stats.total },
    { key: "active", label: "Active", count: stats.active },
    { key: "unsubscribed", label: "Unsubscribed", count: stats.unsubscribed },
  ];

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow text-[var(--gold)]">Newsletter</span>
          <h1 className="mt-1 font-serif text-2xl font-medium">Newsletter Subscribers</h1>
          <p className="text-sm text-muted-foreground">
            Manage email subscribers collected from the homepage and checkout.
          </p>
        </div>
        <Button onClick={onExport} disabled={exporting || subs.length === 0} className="rounded-full">
          {exporting ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Exporting…
            </>
          ) : (
            <>
              <Download className="size-4" /> Export CSV
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-xl border p-4 text-left transition-colors",
              filter === f.key
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:bg-secondary/50"
            )}
          >
            <div className="text-2xl font-bold">{f.count}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {f.label}
            </div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email…"
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-secondary/30">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Name</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Source</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Subscribed</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                  <Loader2 className="mx-auto size-6 animate-spin" />
                </td>
              </tr>
            ) : subs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                  <Mail className="mx-auto mb-3 size-8 opacity-40" />
                  No subscribers found.
                </td>
              </tr>
            ) : (
              subs.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium">{s.email}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {s.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {s.active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-700">
                        <Check className="size-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        <UserX className="size-3" /> Unsubscribed
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {s.source}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {new Date(s.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      {s.active ? (
                        <button
                          type="button"
                          onClick={() => onUnsubscribe(s.id, s.email)}
                          title="Unsubscribe"
                          className="inline-flex size-8 items-center justify-center rounded-md text-amber-600 hover:bg-amber-500/10"
                          aria-label="Unsubscribe"
                        >
                          <UserX className="size-4" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onHardDelete(s.id, s.email)}
                        title="Permanently delete"
                        className="inline-flex size-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                        aria-label="Permanently delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminNewsletter;
