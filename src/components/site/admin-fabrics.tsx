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
  Shirt,
  Power,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import { toast } from "sonner";

type AdminFabric = {
  id: string;
  name: string;
  description: string;
  additionalPrice: number;
  themeValue: string;
  active: boolean;
  sortOrder: number;
};

type FabricForm = {
  name: string;
  description: string;
  additionalPrice: string;
  themeValue: string;
  sortOrder: string;
};

const EMPTY_FORM: FabricForm = {
  name: "",
  description: "",
  additionalPrice: "0",
  themeValue: "#6b5246",
  sortOrder: "0",
};

const ACTIVE_FILTERS = ["all", "active", "inactive"] as const;

export function AdminFabrics() {
  const [fabrics, setFabrics] = React.useState<AdminFabric[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<
    (typeof ACTIVE_FILTERS)[number]
  >("all");

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminFabric | null>(null);
  const [form, setForm] = React.useState<FabricForm>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<AdminFabric | null>(
    null
  );
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/fabrics", { cache: "no-store" });
      const d = (await res.json()) as { fabrics?: AdminFabric[] };
      setFabrics(d.fabrics || []);
    } catch {
      toast.error("Failed to load fabrics");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = fabrics.filter((f) => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (activeFilter === "active" && !f.active) return false;
    if (activeFilter === "inactive" && f.active) return false;
    return true;
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (f: AdminFabric) => {
    setEditing(f);
    setForm({
      name: f.name,
      description: f.description,
      additionalPrice: String(f.additionalPrice ?? 0),
      themeValue: f.themeValue || "#6b5246",
      sortOrder: String(f.sortOrder ?? 0),
    });
    setModalOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("Fabric name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        description: form.description.trim(),
        additionalPrice: Number(form.additionalPrice) || 0,
        themeValue: form.themeValue.trim(),
        sortOrder: Number(form.sortOrder) || 0,
      };
      const url = editing
        ? `/api/admin/fabrics/${editing.id}`
        : "/api/admin/fabrics";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !d.ok) {
        throw new Error(d.error || "Failed to save fabric");
      }
      toast.success(editing ? "Fabric updated" : "Fabric created", {
        description: name,
      });
      setModalOpen(false);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save fabric");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (f: AdminFabric) => {
    setTogglingId(f.id);
    try {
      const res = await fetch(`/api/admin/fabrics/${f.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !f.active }),
      });
      if (!res.ok) throw new Error();
      toast.success(!f.active ? "Fabric activated" : "Fabric deactivated", {
        description: `${f.name} is now ${!f.active ? "visible" : "hidden"} from customers.`,
      });
      void load();
    } catch {
      toast.error("Failed to update fabric status");
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/fabrics/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Fabric deleted", { description: deleteConfirm.name });
      setDeleteConfirm(null);
      void load();
    } catch {
      toast.error("Failed to delete fabric");
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = fabrics.filter((f) => f.active).length;
  const inactiveCount = fabrics.length - activeCount;

  return (
    <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow text-[var(--gold)]">Catalog Configuration</span>
          <h1 className="mt-1 font-serif text-2xl font-medium sm:text-3xl">Fabrics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage fabrics available in the Customized Abaya builder. Each fabric
            adds its additional price to the base price.
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-full">
          <Plus className="size-4" /> Add Fabric
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fabrics…"
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
          Total: <span className="font-medium text-foreground">{fabrics.length}</span>
        </span>
        <span>
          Active: <span className="font-medium text-green-700">{activeCount}</span>
        </span>
        <span>
          Inactive: <span className="font-medium text-amber-700">{inactiveCount}</span>
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed py-12 text-center">
          <Shirt className="mx-auto size-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">No fabrics found.</p>
        </div>
      ) : (
        <div className="mt-6 max-w-full overflow-x-auto elegant-scroll">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-secondary/50">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Fabric</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Additional Price</th>
                <th className="px-4 py-3">Theme</th>
                <th className="px-4 py-3 text-center">Visibility</th>
                <th className="px-4 py-3 text-right">Sort</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((f) => {
                const isToggling = togglingId === f.id;
                return (
                  <tr
                    key={f.id}
                    className={cn("hover:bg-secondary/20", !f.active && "opacity-60")}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="block size-9 flex-none rounded-md ring-1 ring-inset ring-black/10"
                          style={{ backgroundColor: f.themeValue || "#6b5246" }}
                          title={f.themeValue}
                        />
                        <span className="font-medium">{f.name}</span>
                      </div>
                    </td>
                    <td className="max-w-[280px] truncate px-4 py-3 text-muted-foreground">
                      {f.description || <span className="italic">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {f.additionalPrice > 0 ? (
                        <span className="font-medium">
                          +{formatPKR(f.additionalPrice)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Included</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {f.themeValue ? (
                        <code className="rounded bg-secondary px-2 py-0.5 text-xs">
                          {f.themeValue}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(f)}
                        disabled={isToggling}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.65rem] font-medium transition-all disabled:opacity-50",
                          f.active
                            ? "bg-green-500/15 text-green-700 hover:bg-green-500/25"
                            : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"
                        )}
                        title={f.active ? "Active — click to deactivate" : "Inactive — click to activate"}
                      >
                        {isToggling ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Power className="size-3" />
                        )}
                        {f.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {f.sortOrder}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(f)}
                          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                          aria-label="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(f)}
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
      )}

      {/* Create / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border bg-background p-0">
          <DialogTitle className="sr-only">
            {editing ? "Edit fabric" : "Create fabric"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {editing
              ? "Update an existing fabric option"
              : "Add a new fabric for the Customized Abaya builder"}
          </DialogDescription>

          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <Shirt className="size-5 text-[var(--gold)]" />
              <h2 className="font-serif text-lg font-medium">
                {editing ? "Edit Fabric" : "New Fabric"}
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
                  placeholder="e.g. Premium Matte Crepe"
                />
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
                  placeholder="Lightweight, breathable fabric with a soft matte finish…"
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
                    Added on top of the base abaya price.
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

              <Label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Theme Value (accent color)
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.themeValue}
                    onChange={(e) =>
                      setForm({ ...form, themeValue: e.target.value })
                    }
                    className="size-10 cursor-pointer rounded-md border bg-background p-1"
                    aria-label="Theme color picker"
                  />
                  <Input
                    value={form.themeValue}
                    onChange={(e) =>
                      setForm({ ...form, themeValue: e.target.value })
                    }
                    placeholder="#6b5246"
                    className="flex-1"
                  />
                  <span
                    className="block size-10 flex-none rounded-md ring-1 ring-inset ring-black/10"
                    style={{ backgroundColor: form.themeValue }}
                  />
                </div>
                <p className="mt-1 text-[0.65rem] text-muted-foreground">
                  Subtle accent color shown in the customer-side builder when this
                  fabric is selected.
                </p>
              </Label>
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
            <h3 className="mt-3 font-serif text-lg font-medium">Delete this fabric?</h3>
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

export default AdminFabrics;
