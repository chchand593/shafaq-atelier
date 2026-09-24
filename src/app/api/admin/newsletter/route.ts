import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/newsletter?active=true|false&q=search&page=1&limit=100
// Admin-only: list newsletter subscribers.
// DELETE /api/admin/newsletter?id=<subscriberId>&hard=true
// Unsubscribes (soft, active=false) or hard-deletes a single subscriber.
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const activeFilter = searchParams.get("active"); // "true" | "false" | null (all)
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") || "100", 10)));

  const where: { active?: boolean; email?: { contains: string } } = {};
  if (activeFilter === "true") where.active = true;
  if (activeFilter === "false") where.active = false;
  if (q) where.email = { contains: q };

  const [subscribers, total, totalActive, totalAll] = await Promise.all([
    db.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.newsletterSubscriber.count({ where }),
    db.newsletterSubscriber.count({ where: { active: true } }),
    db.newsletterSubscriber.count(),
  ]);

  return NextResponse.json({
    subscribers: subscribers.map((s) => ({
      id: s.id,
      email: s.email,
      name: s.name,
      active: s.active,
      source: s.source,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    total,
    page,
    limit,
    stats: {
      total: totalAll,
      active: totalActive,
      unsubscribed: totalAll - totalActive,
    },
  });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing ?id= parameter" }, { status: 400 });
  }

  const hard = searchParams.get("hard") === "true";

  if (hard) {
    await db.newsletterSubscriber.delete({ where: { id } });
    return NextResponse.json({ ok: true, action: "deleted" });
  }

  const sub = await db.newsletterSubscriber.update({
    where: { id },
    data: { active: false },
  });
  return NextResponse.json({ ok: true, action: "unsubscribed", subscriber: sub });
}
