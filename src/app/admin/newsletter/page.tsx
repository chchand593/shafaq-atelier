import type { Metadata } from "next";
import { AdminLayout } from "@/components/site/admin-layout";
import { AdminNewsletter } from "@/components/site/admin-newsletter";

export const metadata: Metadata = {
  title: "Newsletter — ShafaQ Atelier Admin",
  robots: { index: false, follow: false },
};

export default function AdminNewsletterPage() {
  return (
    <AdminLayout>
      <AdminNewsletter />
    </AdminLayout>
  );
}
