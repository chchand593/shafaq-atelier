import type { Metadata } from "next";
import { AdminLayout } from "@/components/site/admin-layout";
import { AdminOverview } from "@/components/site/admin-overview";

export const metadata: Metadata = {
  title: "Admin Dashboard — ShafaQ Atelier",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <AdminLayout>
      <AdminOverview />
    </AdminLayout>
  );
}
