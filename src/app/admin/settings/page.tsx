import type { Metadata } from "next";
import { AdminLayout } from "@/components/site/admin-layout";
import { AdminSettings } from "@/components/site/admin-settings";

export const metadata: Metadata = {
  title: "Settings — ShafaQ Atelier Admin",
  robots: { index: false, follow: false },
};

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <AdminSettings />
    </AdminLayout>
  );
}
