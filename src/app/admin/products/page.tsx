import type { Metadata } from "next";
import { AdminLayout } from "@/components/site/admin-layout";
import { AdminProducts } from "@/components/site/admin-products";

export const metadata: Metadata = {
  title: "Products — ShafaQ Atelier Admin",
  robots: { index: false, follow: false },
};

export default function AdminProductsPage() {
  return (
    <AdminLayout>
      <AdminProducts />
    </AdminLayout>
  );
}
