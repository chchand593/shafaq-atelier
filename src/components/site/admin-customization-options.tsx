"use client";

import * as React from "react";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Check,
  Loader2,
  AlertTriangle,
  Sparkles,
  Power,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import { toast } from "sonner";

type AdminOption = {
  id: string;
  name: string;
  description: string;
  optionType: string;
  additionalPrice: number;
  active: boolean;
  sortOrder: number;
};

type OptionForm = {
  name: string;
  description: string;
  optionType: string;
  additionalPrice: string;
  sortOrder: string;
};

const EMPTY_FORM: OptionForm = {
  name: "",
  description: "",
  optionType: "style",
  additionalPrice: "0",
  sortOrder: "0",
};

// Canonical group order for display. Any unknown optionType still renders in a
// section at the bottom under its raw name.
const GROUP_ORDER = [
  "style",
  "sleeves",
  "hijab",
  "embroidery",
  "details",
  "addon",
] as const;

const GROUP_LABELS: Record<string, string> = {
  style: "Style",
  sleeves: "Sleeves",
  hijab: "Hijab",
  embroidery: "Embroidery",
  details: "Details",
  addon: "Add-ons",
};

const OPTION_TYPES = GROUP_ORDER.map((g) => ({
  value: g,
  label: GROUP_LABELS[g],
}));

const ACTIVE_FILTERS = ["all", "active", "inactive"] as const;

export function AdminCustomizationOptions() {
  const [options, setOptions] = React.useState<AdminOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<
    (typeof ACTIVE_FILTERS)[number]
  >("all");

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminOption | null>(null);
  const [form, setForm] = React.useState<OptionForm>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<AdminOption | null>(
    null
  );
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customization-options", {
        cache: "no-store",
      });
      const d = (await res.json()) as { options?: AdminOption[] };
      setOptions(d.options || []);
    } catch {
      toast.error("Failed to load add-ons");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = options.filter((o) => {
    if (search && !o.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (activeFilter === "active" && !o.active) return false;
    if (activeFilter === "inactive" && o.active) return false;
    return true;
  });

  // Group filtered results by optionType (preserving canonical order, then any
  // unknown types appended after).
  const grouped = React.useMemo(() => {
    const map = new Map<string, AdminOption[]>();
    for (const o of filtered) {
      const arr = map.get(o.optionType) || [];
      arr.push(o);
      map.set(o.optionType, arr);
    }
    const known = GROUP_ORDER.filter((g) => map.has(g));
    const unknown = Array.from(map.keys()).filter(
      (k) => !GROUP_ORDER.includes(k as (typeof GROUP_ORDER)[number])
    );
    return [...known, ...unknown].map((g) => ({
      type: g,
      label: GROUP_LABELS[g] || g,
      items: map.get(g) || [],
    }));
  }, [filtered]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (o: AdminOption) => {
    setEditing(o);
    setForm({
      name: o.name,
      description: o.description,
      optionType: o.optionType,
      additionalPrice: String(o.additionalPrice ?? 0),
      sortOrder: String(o.sortOrder ?? 0),
    });
    setModalOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("Add-on name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        description: form.description.trim(),
        optionType: form.optionType,
        additionalPrice: Number(form.additionalPrice) || 0,
        sortOrder: Number(form.sortOrder) || 0,
      };
      const url = editing
        ? `/api/admin/customization-options/${editing.id}`
        : "/api/admin/customization-options";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !d.ok) {
        throw new Error(d.error || "Failed to save add-on");
      }
      toast.success(editing ? "Add-on updated" : "Add-on created", {
        description: name,
      });
      setModalOpen(false);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save add-on");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (o: AdminOption) => {
    setTogglingId(o.id);
    try {
      const res = await fetch(`/api/admin/customization-options/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !o.active }),
      });
      if (!res.ok) throw new Error();
      toast.success(!o.active ? "Add-on activated" : "Add-on deactivated", {
        description: `${o.name} is now ${!o.active ? "visible" : "hidden"} from customers.`,
      });
      void load();
    } catch {
      toast.error("Failed to update add-on status");
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/customization-options/${deleteConfirm.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      toast.success("Add-on deleted", { description: deleteConfirm.name });
      setDeleteConfirm(null);
      void load();
    } catch {
      toast.error("Failed to delete add-on");
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = options.filter((o) => o.active).length;
  const inactiveCount = options.length - activeCount;

  return (
    <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow text-[var(--gold)]">Catalog Configuration</span>
          <h1 className="mt-1 font-serif text-2xl font-medium sm:text-3xl">Add-ons</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage customization options for the Customized Abaya builder — grouped
            by option type (style, sleeves, hijab, embroidery, details, add-ons).
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-full">
          <Plus className="size-4" /> Add Option
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search add-ons…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 rounded-md border bg-background p-0.5">
          {ACTIVE_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={cn(
                "rounded px-2.5 py-1.5 text-xs font-medium capitalize transition-all",
                activeFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Counts summary */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>
          Total: <span className="font-medium text-foreground">{options.length}</span>
        </span>
        <span>
          Active: <span className="font-medium text-green-700">{activeCount}</span>
        </span>
        <span>
          Inactive: <span className="font-medium text-amber-700">{inactiveCount}</span>
        </span>
        <span>
          Groups: <span className="font-medium text-foreground">{grouped.length}</span>
        </span>
      </div>

      {/* Grouped tables */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed py-12 text-center">
          <Sparkles className="mx-auto size-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">No add-ons found.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {grouped.map((group) => (
            <section key={group.type} className="rounded-xl border bg-card">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                  <span className="eyebrow text-[var(--gold)]">
                    {group.type}
                  </span>
                  <h2 className="font-serif text-lg font-medium">
                    {group.label}
                  </h2>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                  {group.items.length}{" "}
                  {group.items.length === 1 ? "option" : "options"}
                </span>
              </div>

              <div className="max-w-full overflow-x-auto elegant-scroll">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-secondary/30">
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Additional Price</th>
                      <th className="px-4 py-3 text-center">Visibility</th>
                      <th className="px-4 py-3 text-right">Sort</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {group.items.map((o) => {
                      const isToggling = togglingId === o.id;
                      return (
                        <tr
                          key={o.id}
                          className={cn(
                            "hover:bg-secondary/20",
                            !o.active && "opacity-60"
                          )}
                        >
                          <td className="px-4 py-3 font-medium">{o.name}</td>
                          <td className="max-w-[280px] truncate px-4 py-3 text-muted-foreground">
                            {o.description || (
                              <span className="italic">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {o.additionalPrice > 0 ? (
                              <span className="font-medium">
                                +{formatPKR(o.additionalPrice)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Free</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggle(o)}
                              disabled={isToggling}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.65rem] font-medium transition-all disabled:opacity-50",
                                o.active
                                  ? "bg-green-500/15 text-green-700 hover:bg-green-500/25"
                                  : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"
                              )}
                              title={
                                o.active
                                  ? "Active — click to deactivate"
                                  : "Inactive — click to activate"
                              }
                            >
                              {isToggling ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Power className="size-3" />
                              )}
                              {o.active ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                            {o.sortOrder}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEdit(o)}
                                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                                aria-label="Edit"
                              >
                                <Pencil className="size-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm(o)}
                                className="inline-flex size-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                                aria-label="Delete"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border bg-background p-0">
          <DialogTitle className="sr-only">
            {editing ? "Edit add-on" : "Create add-on"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {editing
              ? "Update an existing customization option"
              : "Add a new customization option for the Customized Abaya builder"}
          </DialogDescription>

          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-[var(--gold)]" />
              <h2 className="font-serif text-lg font-medium">
                {editing ? "Edit Add-on" : "New Add-on"}
              </h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto elegant-scroll px-6 py-5">
            <div className="grid gap-4">
              <Label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Name <span className="text-[var(--gold)]">*</span>
                </span>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Bell Sleeves"
                />
              </Label>

              <Label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Option Type
                </span>
                <Select
                  value={form.optionType}
                  onValueChange={(v) => setForm({ ...form, optionType: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[0.65rem] text-muted-foreground">
                  Groups this add-on under the corresponding section in the
                  Customized Abaya builder.
                </p>
              </Label>

              <Label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Description
                </span>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  placeholder="Flowing bell-shaped sleeves…"
                />
              </Label>

              <div className="grid gap-4 sm:grid-cols-2">
                <Label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Additional Price (PKR)
                  </span>
                  <Input
                    type="number"
                    value={form.additionalPrice}
                    onChange={(e) =>
                      setForm({ ...form, additionalPrice: e.target.value })
                    }
                    placeholder="0"
                    min={0}
                  />
                  <p className="mt-1 text-[0.65rem] text-muted-foreground">
                    Added on top of the base + fabric price.
                  </p>
                </Label>

                <Label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Sort order
                  </span>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: e.target.value })
                    }
                    placeholder="0"
                    min={0}
                  />
                </Label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-full px-6"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Check className="size-4" /> {editing ? "Save" : "Create"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      {deleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-sm rounded-xl border bg-card p-6 text-center shadow-lg">
            <AlertTriangle className="mx-auto size-10 text-destructive" />
            <h3 className="mt-3 font-serif text-lg font-medium">
              Delete this add-on?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              <strong className="text-foreground">{deleteConfirm.name}</strong>{" "}
              will be permanently removed from the Customized Abaya builder.
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 rounded-full bg-destructive text-white hover:bg-destructive/90"
              >
                {deleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="size-4" /> Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AdminCustomizationOptions;
