import type { Metadata } from "next";
import { AdminLayout } from "@/components/site/admin-layout";
import { AdminAbayaImages } from "@/components/site/admin-abaya-images";

export const metadata: Metadata = {
  title: "Abaya Images — ShafaQ Atelier Admin",
  robots: { index: false, follow: false },
};

export default function AdminAbayaImagesPage() {
  return (
    <AdminLayout>
      <AdminAbayaImages />
    </AdminLayout>
  );
}
