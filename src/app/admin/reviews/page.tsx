import type { Metadata } from "next";
import { AdminLayout } from "@/components/site/admin-layout";
import { AdminReviews } from "@/components/site/admin-reviews";

export const metadata: Metadata = {
  title: "Reviews — ShafaQ Atelier Admin",
  robots: { index: false, follow: false },
};

export default function AdminReviewsPage() {
  return (
    <AdminLayout>
      <AdminReviews />
    </AdminLayout>
  );
}
