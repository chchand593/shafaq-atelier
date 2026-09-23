import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// PATCH /api/admin/reviews/[id]
// Body: { approved?: boolean, featured?: boolean }
// Used by the admin reviews moderation UI to approve / reject / feature
// a review. Returns the updated review.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    approved?: boolean;
    featured?: boolean;
  };

  const data: { approved?: boolean; featured?: boolean } = {};
  if (typeof body.approved === "boolean") data.approved = body.approved;
  if (typeof body.featured === "boolean") data.featured = body.featured;

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Nothing to update — send approved and/or featured." },
      { status: 400 }
    );
  }

  const review = await db.review.update({ where: { id }, data });
  return NextResponse.json({ ok: true, review });
}

// DELETE /api/admin/reviews/[id] — delete a review (moderation)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db.review.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
