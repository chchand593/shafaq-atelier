import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// PATCH /api/admin/reviews/[id]/reply — add or update an admin reply to a review
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { reply } = (await request.json()) as { reply?: string };

  if (typeof reply !== "string") {
    return NextResponse.json({ error: "Reply text required" }, { status: 400 });
  }

  const review = await db.review.update({
    where: { id },
    data: {
      adminReply: reply.trim() || null,
      adminReplyAt: reply.trim() ? new Date() : null,
    },
  });

  return NextResponse.json({
    ok: true,
    adminReply: review.adminReply,
    adminReplyAt: review.adminReplyAt,
  });
}
