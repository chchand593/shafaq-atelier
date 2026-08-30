import type { Metadata } from "next";
import { AdminLayout } from "@/components/site/admin-layout";
import { AdminOrders } from "@/components/site/admin-orders";

export const metadata: Metadata = {
  title: "Orders — ShafaQ Atelier Admin",
  robots: { index: false, follow: false },
};

export default function AdminOrdersPage() {
  return (
    <AdminLayout>
      <AdminOrders />
    </AdminLayout>
  );
}
