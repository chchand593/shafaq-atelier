import type { Metadata } from "next";
import { AdminLayout } from "@/components/site/admin-layout";
import { AdminColors } from "@/components/site/admin-colors";

export const metadata: Metadata = {
  title: "Colors — ShafaQ Atelier Admin",
  robots: { index: false, follow: false },
};

export default function AdminColorsPage() {
  return (
    <AdminLayout>
      <AdminColors />
    </AdminLayout>
  );
}
