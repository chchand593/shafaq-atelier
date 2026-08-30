import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { OrderTrackingPage } from "@/components/site/order-tracking";
import { SiteChrome } from "@/components/site/site-chrome";

type Params = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { number } = await params;
  return {
    title: `Order ${number} — ShafaQ Atelier`,
    description: "Track your ShafaQ Atelier order status and delivery details.",
  };
}

export default async function OrderPage({ params }: Params) {
  const { number: rawNumber } = await params;
  // Normalise: ensure LM- prefix, uppercase
  const number = rawNumber.startsWith("LM-")
    ? rawNumber.toUpperCase()
    : `LM-${rawNumber.toUpperCase()}`;

  const row = await db.order.findUnique({
    where: { number },
    include: { items: true },
  });

  if (!row) {
    return (
      <SiteChrome>
        <OrderTrackingPage initialOrder={null} number={number} />
      </SiteChrome>
    );
  }

  const order = {
    number: row.number,
    status: row.status,
    paymentStatus: row.paymentStatus,
    email: row.email,
    fullName: row.fullName,
    phone: row.phone,
    address: row.address,
    city: row.city,
    province: row.province,
    postal: row.postal,
    payment: row.payment,
    subtotal: row.subtotal,
    discount: row.discount,
    shipping: row.shipping,
    total: row.total,
    promoCode: row.promoCode,
    createdAt: row.createdAt.toISOString(),
    items: row.items.map((it) => ({
      name: it.name,
      image: it.image,
      price: it.price,
      qty: it.qty,
      colorName: it.colorName,
      size: it.size,
      productId: it.productId,
    })),
  };

  return (
    <SiteChrome>
      <OrderTrackingPage initialOrder={order} number={number} />
    </SiteChrome>
  );
}
