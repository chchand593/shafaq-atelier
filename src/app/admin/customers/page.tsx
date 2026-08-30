import type { Metadata } from "next";
import { AdminLayout } from "@/components/site/admin-layout";
import { AdminCustomers } from "@/components/site/admin-customers";

export const metadata: Metadata = {
  title: "Customers — ShafaQ Atelier Admin",
  robots: { index: false, follow: false },
};

export default function AdminCustomersPage() {
  return (
    <AdminLayout>
      <AdminCustomers />
    </AdminLayout>
  );
}
