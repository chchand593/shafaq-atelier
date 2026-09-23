import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/reviews/[slug] — list reviews for a product
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = await db.product.findUnique({ where: { slug } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") || "newest";

  let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
  if (sort === "helpful") orderBy = { helpful: "desc" };
  else if (sort === "highest") orderBy = { rating: "desc" };
  else if (sort === "lowest") orderBy = { rating: "asc" };

  const reviews = await db.review.findMany({
    where: { productId: product.id },
    orderBy,
  });

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      title: r.title,
      body: r.body,
      verified: r.verified,
      helpful: r.helpful,
      adminReply: r.adminReply,
      adminReplyAt: r.adminReplyAt,
      createdAt: r.createdAt,
    })),
    distribution,
    average:
      reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : product.rating,
    total: reviews.length,
  });
}

// POST /api/reviews/[slug] — create a review (auth required)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Please sign in to write a review." },
      { status: 401 }
    );
  }

  const product = await db.product.findUnique({ where: { slug } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const { rating, title, body } = (await request.json()) as {
    rating?: number;
    title?: string;
    body?: string;
  };

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Please select a rating between 1 and 5." },
      { status: 400 }
    );
  }
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json(
      { error: "Please add a title and review." },
      { status: 400 }
    );
  }

  // Check if the user has purchased this product (verified buyer)
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: {
      orders: {
        include: { items: true },
      },
    },
  });
  const verified = (user?.orders ?? []).some((o) =>
    o.items.some((it) => it.productId === slug)
  );

  const review = await db.review.create({
    data: {
      productId: product.id,
      userId: user?.id ?? null,
      authorName: user?.name || session.user.name || session.user.email,
      rating: Math.round(rating),
      title: title.trim().slice(0, 120),
      body: body.trim().slice(0, 1000),
      verified,
    },
  });

  // Update product aggregate rating + count
  const allReviews = await db.review.findMany({
    where: { productId: product.id },
    select: { rating: true },
  });
  const newAvg =
    allReviews.length > 0
      ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
      : product.rating;
  await db.product.update({
    where: { id: product.id },
    data: {
      rating: Math.round(newAvg * 10) / 10,
      reviewCount: product.reviewCount + 1,
    },
  });

  return NextResponse.json({ ok: true, review });
}
