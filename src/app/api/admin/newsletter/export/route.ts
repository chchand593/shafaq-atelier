import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/newsletter/export?active=true|false&q=search
//
// Exports newsletter subscribers as a CSV file (Content-Type: text/csv,
// Content-Disposition: attachment). Admin-only. Returns all matching
// rows (no pagination) so the admin can import into Mailchimp / any
// email tool.
//
// CSV columns: Email, Name, Status, Source, Subscribed At, Updated At
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const activeFilter = searchParams.get("active");
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  const where: { active?: boolean; email?: { contains: string } } = {};
  if (activeFilter === "true") where.active = true;
  if (activeFilter === "false") where.active = false;
  if (q) where.email = { contains: q };

  const subscribers = await db.newsletterSubscriber.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // Build CSV. Escape fields that contain commas/quotes/newlines.
  const esc = (v: string | null | undefined) => {
    const s = (v ?? "").toString();
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = [
    ["Email", "Name", "Status", "Source", "Subscribed At", "Updated At"]
      .map(esc)
      .join(","),
    ...subscribers.map((s) =>
      [
        s.email,
        s.name ?? "",
        s.active ? "active" : "unsubscribed",
        s.source,
        s.createdAt.toISOString(),
        s.updatedAt.toISOString(),
      ]
        .map(esc)
        .join(",")
    ),
  ];
  const csv = rows.join("\r\n");

  const filename = `shafaq-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
