import type { Metadata } from "next";
import { AdminLayout } from "@/components/site/admin-layout";
import { AdminCustomerDetail } from "@/components/site/admin-customer-detail";

export const metadata: Metadata = {
  title: "Customer Detail — ShafaQ Atelier Admin",
  robots: { index: false, follow: false },
};

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminLayout>
      <AdminCustomerDetail customerId={id} />
    </AdminLayout>
  );
}
