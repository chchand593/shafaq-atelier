import type { Metadata } from "next";
import { AdminLayout } from "@/components/site/admin-layout";
import { AdminFabrics } from "@/components/site/admin-fabrics";

export const metadata: Metadata = {
  title: "Fabrics — ShafaQ Atelier Admin",
  robots: { index: false, follow: false },
};

export default function AdminFabricsPage() {
  return (
    <AdminLayout>
      <AdminFabrics />
    </AdminLayout>
  );
}
