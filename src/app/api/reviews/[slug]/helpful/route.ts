import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/reviews/[slug]/helpful — mark a review as helpful
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  // slug here is actually the review id (passed through the reviews/[slug] path)
  const review = await db.review.findUnique({ where: { id: slug } });
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const updated = await db.review.update({
    where: { id: slug },
    data: { helpful: { increment: 1 } },
  });

  return NextResponse.json({ ok: true, helpful: updated.helpful });
}
