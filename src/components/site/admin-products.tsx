"use client";

import * as React from "react";
import { Plus, Search, Trash2, Pencil, Loader2, AlertTriangle, Package, Power, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import { ProductCreateModal } from "@/components/site/product-create-modal";
import { AdminColorImagesModal } from "@/components/site/admin-color-images-modal";
import { AdminProductEditModal } from "@/components/site/admin-product-edit-modal";
import type { ColorImage, ColorOption } from "@/lib/site-data";
import { toast } from "sonner";

type AdminProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  lowStockThreshold: number;
  active: boolean;
  reviews: number;
  rating: number;
  badge?: string;
  image: string;
  // Optional — returned by /api/admin/products but not displayed in the
  // table. Used by the Color Images modal to know which colors exist.
  colorOptions?: ColorOption[];
  colorImages?: ColorImage[];
};

const ACTIVE_FILTERS = ["all", "active", "inactive"] as const;

export function AdminProducts() {
  const [products, setProducts] = React.useState<AdminProduct[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [stockFilter, setStockFilter] = React.useState("all");
  const [activeFilter, setActiveFilter] = React.useState<(typeof ACTIVE_FILTERS)[number]>("all");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editProduct, setEditProduct] = React.useState<AdminProduct | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);
  const [toggleConfirm, setToggleConfirm] = React.useState<{ slug: string; name: string; toActive: boolean } | null>(null);
  const [togglingSlug, setTogglingSlug] = React.useState<string | null>(null);
  const [colorImagesProduct, setColorImagesProduct] = React.useState<AdminProduct | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const d = (await res.json()) as { products: AdminProduct[] };
      setProducts(d.products || []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (stockFilter === "out" && p.stock > 0) return false;
    if (stockFilter === "low" && (p.stock <= 0 || p.stock > p.lowStockThreshold)) return false;
    if (stockFilter === "in" && p.stock <= p.lowStockThreshold) return false;
    if (activeFilter === "active" && !p.active) return false;
    if (activeFilter === "inactive" && p.active) return false;
    return true;
  });

  const confirmToggle = (p: AdminProduct) => {
    setToggleConfirm({ slug: p.id, name: p.name, toActive: !p.active });
  };

  const performToggle = async () => {
    if (!toggleConfirm) return;
    setTogglingSlug(toggleConfirm.slug);
    try {
      const res = await fetch(`/api/admin/products/${toggleConfirm.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: toggleConfirm.toActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(toggleConfirm.toActive ? "Product activated" : "Product deactivated", {
        description: `${toggleConfirm.name} is now ${toggleConfirm.toActive ? "visible" : "hidden"} from customers.`,
      });
      setToggleConfirm(null);
      void load();
    } catch {
      toast.error("Failed to update product status");
    } finally {
      setTogglingSlug(null);
    }
  };

  const quickToggle = async (p: AdminProduct) => {
    setTogglingSlug(p.id);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !p.active }),
      });
      if (!res.ok) throw new Error();
      toast.success(!p.active ? "Product activated" : "Product deactivated", {
        description: `${p.name} is now ${!p.active ? "visible" : "hidden"} from customers.`,
      });
      void load();
    } catch {
      toast.error("Failed to update product status");
    } finally {
      setTogglingSlug(null);
    }
  };

  const deleteProduct = async (slug: string) => {
    try {
      const res = await fetch(`/api/admin/products/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Product deleted", { description: slug });
      setDeleteConfirm(null);
      void load();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const stockStatus = (p: AdminProduct) => {
    if (p.stock <= 0) return { label: "Out of Stock", class: "bg-destructive/15 text-destructive" };
    if (p.stock <= p.lowStockThreshold) return { label: `Low (${p.stock})`, class: "bg-[var(--gold)]/15 text-[var(--gold)]" };
    return { label: "In Stock", class: "bg-green-500/15 text-green-700" };
  };

  return (
    <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow text-[var(--gold)]">Product Management</span>
          <h1 className="mt-1 font-serif text-2xl font-medium sm:text-3xl">Products</h1>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="rounded-full">
          <Plus className="size-4" /> Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All Categories</option>
          <option value="Daily Wear">Daily Wear</option>
          <option value="New Arrivals">New Arrivals</option>
          <option value="Best Sellers">Best Sellers</option>
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All Stock</option>
          <option value="in">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
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
          Total: <span className="font-medium text-foreground">{products.length}</span>
        </span>
        <span>
          Active: <span className="font-medium text-green-700">{products.filter((p) => p.active).length}</span>
        </span>
        <span>
          Inactive: <span className="font-medium text-amber-700">{products.filter((p) => !p.active).length}</span>
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed py-12 text-center">
          <Package className="mx-auto size-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">No products found.</p>
        </div>
      ) : (
        <div className="mt-6 max-w-full overflow-x-auto elegant-scroll">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-secondary/50">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Threshold</th>
                <th className="px-4 py-3">Stock Status</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p) => {
                const ss = stockStatus(p);
                const isToggling = togglingSlug === p.id;
                return (
                  <tr key={p.id} className={cn("hover:bg-secondary/20", !p.active && "opacity-60")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 flex-none overflow-hidden rounded-md border bg-secondary">
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                        </div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                    <td className="px-4 py-3 text-right">{formatPKR(p.price)}</td>
                    <td className="px-4 py-3 text-right">{p.stock}</td>
                    <td className="px-4 py-3 text-right">{p.lowStockThreshold}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-medium", ss.class)}>
                        {ss.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => quickToggle(p)}
                        disabled={isToggling}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.65rem] font-medium transition-all disabled:opacity-50",
                          p.active
                            ? "bg-green-500/15 text-green-700 hover:bg-green-500/25"
                            : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"
                        )}
                        title={p.active ? "Active — click to deactivate" : "Inactive — click to activate"}
                      >
                        {isToggling ? <Loader2 className="size-3 animate-spin" /> : <Power className="size-3" />}
                        {p.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditProduct(p)}
                          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                          aria-label="Edit product"
                          title="Edit product"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmToggle(p)}
                          className="inline-flex size-8 items-center justify-center rounded-md text-[var(--gold)] hover:bg-[var(--gold)]/10"
                          aria-label="Toggle active"
                          title={p.active ? "Deactivate product" : "Activate product"}
                        >
                          <Power className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setColorImagesProduct(p)}
                          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                          aria-label="Manage color images"
                          title="Manage color images"
                          disabled={(p.colorOptions?.length ?? 0) === 0}
                        >
                          <ImageIcon className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(p.id)}
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

      {/* Delete confirmation */}
      {deleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-sm rounded-xl border bg-card p-6 text-center shadow-lg">
            <AlertTriangle className="mx-auto size-10 text-destructive" />
            <h3 className="mt-3 font-serif text-lg font-medium">Delete this product?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This action cannot be undone. The product will be permanently removed. Existing orders containing it will continue to display correctly.
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={() => deleteProduct(deleteConfirm)}
                className="flex-1 rounded-full bg-destructive text-white hover:bg-destructive/90"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Toggle active confirmation */}
      {toggleConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-sm rounded-xl border bg-card p-6 text-center shadow-lg">
            <span
              className={cn(
                "mx-auto flex size-12 items-center justify-center rounded-full",
                toggleConfirm.toActive
                  ? "bg-green-500/10 text-green-600"
                  : "bg-amber-500/10 text-amber-600"
              )}
            >
              <Power className="size-6" />
            </span>
            <h3 className="mt-3 font-serif text-lg font-medium">
              {toggleConfirm.toActive ? "Activate this product?" : "Deactivate this product?"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {toggleConfirm.toActive
                ? `${toggleConfirm.name} will become visible to customers and purchasable again.`
                : `${toggleConfirm.name} will be hidden from customer listings and cannot be purchased. Existing orders will continue to display correctly.`}
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setToggleConfirm(null)}
                className="flex-1 rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={performToggle}
                disabled={togglingSlug !== null}
                className={cn(
                  "flex-1 rounded-full",
                  toggleConfirm.toActive
                    ? "bg-green-600 text-white hover:bg-green-600/90"
                    : "bg-amber-600 text-white hover:bg-amber-600/90"
                )}
              >
                {togglingSlug ? <Loader2 className="size-4 animate-spin" /> : toggleConfirm.toActive ? "Activate" : "Deactivate"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Color images modal */}
      {colorImagesProduct ? (
        <AdminColorImagesModal
          open={colorImagesProduct !== null}
          onOpenChange={(o) => {
            if (!o) setColorImagesProduct(null);
          }}
          productSlug={colorImagesProduct.id}
          productName={colorImagesProduct.name}
          colorOptions={colorImagesProduct.colorOptions ?? []}
          onSaved={() => void load()}
        />
      ) : null}

      {/* Edit modal */}
      <AdminProductEditModal
        open={editProduct !== null}
        onOpenChange={(o) => {
          if (!o) setEditProduct(null);
        }}
        product={editProduct}
        onSaved={() => void load()}
      />

      {/* Create modal */}
      <ProductCreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void load()}
      />
    </div>
  );
}

export default AdminProducts;
