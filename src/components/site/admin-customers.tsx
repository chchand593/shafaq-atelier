"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";

type Customer = {
  id: string;
  email: string;
  name: string;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
};

type CustomerOrder = {
  id: string;
  number: string;
  total: number;
  status: string;
  createdAt: string;
};

export function AdminCustomers() {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [customerOrders, setCustomerOrders] = React.useState<Record<string, CustomerOrder[]>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers");
      const d = (await res.json()) as { customers: Customer[] };
      setCustomers(d.customers || []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const toggleExpand = async (customer: Customer) => {
    if (expandedId === customer.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(customer.id);
    if (!customerOrders[customer.id] && customer.orderCount > 0) {
      try {
        // Fetch orders filtered by this customer's email via the orders API
        const res = await fetch("/api/admin/orders");
        const d = (await res.json()) as { orders: { id: string; number: string; total: number; status: string; createdAt: string; email: string }[] };
        const filtered = (d.orders || []).filter((o) => o.email === customer.email);
        setCustomerOrders((prev) => ({
          ...prev,
          [customer.id]: filtered.map((o) => ({
            id: o.id,
            number: o.number,
            total: o.total,
            status: o.status,
            createdAt: o.createdAt,
          })),
        }));
      } catch {
        // ignore
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <span className="eyebrow text-[var(--gold)]">Customer Management</span>
        <h1 className="font-serif text-2xl font-medium sm:text-3xl">Customers</h1>
      </div>

      {customers.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">No customers found.</p>
        </div>
      ) : (
        <div className="mt-6 max-w-full overflow-x-auto elegant-scroll">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-secondary/50">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-right">Orders</th>
                <th className="px-4 py-3 text-right">Total Spent</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((c) => (
                <React.Fragment key={c.id}>
                  <tr className="hover:bg-secondary/20">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/admin/customers/${c.id}`} className="hover:text-[var(--gold)]">
                        {c.name || "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                    <td className="px-4 py-3 text-right">{c.orderCount}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatPKR(c.totalSpent)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.orderCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(c)}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          {expandedId === c.id ? "Hide" : "View Orders"}
                          {expandedId === c.id ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                  {expandedId === c.id ? (
                    <tr>
                      <td colSpan={6} className="bg-secondary/20 px-4 py-3">
                        {customerOrders[c.id] ? (
                          customerOrders[c.id].length === 0 ? (
                            <p className="text-xs text-muted-foreground">No orders found.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {customerOrders[c.id].map((o) => (
                                <div key={o.id} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-xs">
                                  <span className="font-mono font-medium">{o.number}</span>
                                  <span className="text-muted-foreground">
                                    {new Date(o.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                                  </span>
                                  <span className="font-semibold">{formatPKR(o.total)}</span>
                                  <span className="rounded-full bg-secondary px-2 py-0.5 capitalize text-muted-foreground">{o.status}</span>
                                </div>
                              ))}
                            </div>
                          )
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="size-3 animate-spin" /> Loading orders…
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminCustomers;
