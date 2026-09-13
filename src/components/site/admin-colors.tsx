"use client";

import * as React from "react";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  X,
  Check,
  Loader2,
  AlertTriangle,
  Palette,
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AdminColor = {
  id: string;
  name: string;
  hex: string;
  active: boolean;
  sortOrder: number;
};

type ColorForm = {
  name: string;
  hex: string;
  sortOrder: string;
};

const EMPTY_FORM: ColorForm = { name: "", hex: "#1a1a1a", sortOrder: "0" };

const ACTIVE_FILTERS = ["all", "active", "inactive"] as const;

export function AdminColors() {
  const [colors, setColors] = React.useState<AdminColor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<
    (typeof ACTIVE_FILTERS)[number]
  >("all");

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminColor | null>(null);
  const [form, setForm] = React.useState<ColorForm>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<AdminColor | null>(
    null
  );
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/colors", { cache: "no-store" });
      const d = (await res.json()) as { colors?: AdminColor[] };
      setColors(d.colors || []);
    } catch {
      toast.error("Failed to load colors");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = colors.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (activeFilter === "active" && !c.active) return false;
    if (activeFilter === "inactive" && c.active) return false;
    return true;
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (c: AdminColor) => {
    setEditing(c);
    setForm({
      name: c.name,
      hex: c.hex,
      sortOrder: String(c.sortOrder ?? 0),
    });
    setModalOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("Color name is required");
      return;
    }
    if (!form.hex.trim()) {
      toast.error("Hex value is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        hex: form.hex.trim(),
        sortOrder: Number(form.sortOrder) || 0,
      };
      const url = editing
        ? `/api/admin/colors/${editing.id}`
        : "/api/admin/colors";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !d.ok) {
        throw new Error(d.error || "Failed to save color");
      }
      toast.success(editing ? "Color updated" : "Color created", {
        description: name,
      });
      setModalOpen(false);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save color");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: AdminColor) => {
    setTogglingId(c.id);
    try {
      const res = await fetch(`/api/admin/colors/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !c.active }),
      });
      if (!res.ok) throw new Error();
      toast.success(!c.active ? "Color activated" : "Color deactivated", {
        description: `${c.name} is now ${!c.active ? "visible" : "hidden"} from customers.`,
      });
      void load();
    } catch {
      toast.error("Failed to update color status");
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/colors/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Color deleted", { description: deleteConfirm.name });
      setDeleteConfirm(null);
      void load();
    } catch {
      toast.error("Failed to delete color");
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = colors.filter((c) => c.active).length;
  const inactiveCount = colors.length - activeCount;

  return (
    <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow text-[var(--gold)]">Catalog Configuration</span>
          <h1 className="mt-1 font-serif text-2xl font-medium sm:text-3xl">Colors</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the color palette used by products and the Customized Abaya builder.
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-full">
          <Plus className="size-4" /> Add Color
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search colors…"
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
          Total: <span className="font-medium text-foreground">{colors.length}</span>
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
          <Palette className="mx-auto size-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">No colors found.</p>
        </div>
      ) : (
        <div className="mt-6 max-w-full overflow-x-auto elegant-scroll">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-secondary/50">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Swatch</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Hex</th>
                <th className="px-4 py-3 text-center">Visibility</th>
                <th className="px-4 py-3 text-right">Sort</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c) => {
                const isToggling = togglingId === c.id;
                return (
                  <tr
                    key={c.id}
                    className={cn("hover:bg-secondary/20", !c.active && "opacity-60")}
                  >
                    <td className="px-4 py-3">
                      <span
                        className="block size-9 rounded-full ring-1 ring-inset ring-black/10"
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-secondary px-2 py-0.5 text-xs">
                        {c.hex}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(c)}
                        disabled={isToggling}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.65rem] font-medium transition-all disabled:opacity-50",
                          c.active
                            ? "bg-green-500/15 text-green-700 hover:bg-green-500/25"
                            : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"
                        )}
                        title={c.active ? "Active — click to deactivate" : "Inactive — click to activate"}
                      >
                        {isToggling ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Power className="size-3" />
                        )}
                        {c.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {c.sortOrder}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                          aria-label="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(c)}
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
        <DialogContent className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-xl border bg-background p-0">
          <DialogTitle className="sr-only">
            {editing ? "Edit color" : "Create color"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {editing
              ? "Update an existing color swatch"
              : "Add a new color to the catalog palette"}
          </DialogDescription>

          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <Palette className="size-5 text-[var(--gold)]" />
              <h2 className="font-serif text-lg font-medium">
                {editing ? "Edit Color" : "New Color"}
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
                  placeholder="e.g. Onyx Black"
                />
              </Label>

              <Label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Hex <span className="text-[var(--gold)]">*</span>
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.hex}
                    onChange={(e) => setForm({ ...form, hex: e.target.value })}
                    className="size-10 cursor-pointer rounded-md border bg-background p-1"
                    aria-label="Color picker"
                  />
                  <Input
                    value={form.hex}
                    onChange={(e) => setForm({ ...form, hex: e.target.value })}
                    placeholder="#1a1a1a"
                    className="flex-1"
                  />
                  <span
                    className="block size-10 flex-none rounded-full ring-1 ring-inset ring-black/10"
                    style={{ backgroundColor: form.hex }}
                  />
                </div>
              </Label>

              <Label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Sort order
                </span>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  placeholder="0"
                  min={0}
                />
                <p className="mt-1 text-[0.65rem] text-muted-foreground">
                  Lower numbers appear first in the customer-facing palette.
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
            <h3 className="mt-3 font-serif text-lg font-medium">Delete this color?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              <strong className="text-foreground">{deleteConfirm.name}</strong>{" "}
              will be permanently removed. Products that reference this hex value
              will continue to display their stored colors.
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

export default AdminColors;
