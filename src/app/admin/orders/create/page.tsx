import type { Metadata } from "next";
import { AdminLayout } from "@/components/site/admin-layout";
import { AdminOrderCreate } from "@/components/site/admin-order-create";

export const metadata: Metadata = {
  title: "Create Order — ShafaQ Atelier Admin",
  robots: { index: false, follow: false },
};

export default function AdminOrderCreatePage() {
  return (
    <AdminLayout>
      <AdminOrderCreate />
    </AdminLayout>
  );
}
