import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/reviews — list all reviews for moderation
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all"; // all | replied | unreplied | pending | approved | featured

  const reviews = await db.review.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true, slug: true, image: true } } },
  });

  const mapped = reviews
    .filter((r) => {
      if (filter === "replied") return r.adminReply !== null;
      if (filter === "unreplied") return r.adminReply === null;
      if (filter === "pending") return r.approved === false;
      if (filter === "approved") return r.approved === true;
      if (filter === "featured") return r.featured === true;
      return true;
    })
    .map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      title: r.title,
      body: r.body,
      verified: r.verified,
      approved: r.approved,
      featured: r.featured,
      helpful: r.helpful,
      adminReply: r.adminReply,
      adminReplyAt: r.adminReplyAt,
      createdAt: r.createdAt,
      product: r.product
        ? { name: r.product.name, slug: r.product.slug, image: r.product.image }
        : null,
    }));

  return NextResponse.json({
    reviews: mapped,
    stats: {
      total: reviews.length,
      pending: reviews.filter((r) => r.approved === false).length,
      approved: reviews.filter((r) => r.approved === true).length,
      featured: reviews.filter((r) => r.featured === true).length,
      replied: reviews.filter((r) => r.adminReply !== null).length,
      unreplied: reviews.filter((r) => r.adminReply === null).length,
    },
  });
}
