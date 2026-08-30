import type { Metadata } from "next";
import { AdminLayout } from "@/components/site/admin-layout";
import { AdminOrderDetail } from "@/components/site/admin-order-detail";

export const metadata: Metadata = {
  title: "Order Detail — ShafaQ Atelier Admin",
  robots: { index: false, follow: false },
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  return (
    <AdminLayout>
      <AdminOrderDetail orderNumber={number} />
    </AdminLayout>
  );
}
