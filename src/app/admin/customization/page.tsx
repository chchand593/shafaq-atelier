import type { Metadata } from "next";
import { AdminLayout } from "@/components/site/admin-layout";
import { AdminCustomizationOptions } from "@/components/site/admin-customization-options";

export const metadata: Metadata = {
  title: "Add-ons — ShafaQ Atelier Admin",
  robots: { index: false, follow: false },
};

export default function AdminCustomizationPage() {
  return (
    <AdminLayout>
      <AdminCustomizationOptions />
    </AdminLayout>
  );
}
