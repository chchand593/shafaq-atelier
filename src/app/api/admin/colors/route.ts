import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/colors — list all colors (including inactive), admin only.
// Ordered by sortOrder asc, then name asc so the admin UI shows a stable list.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const colors = await db.color.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ colors });
}

// POST /api/admin/colors — create a color. Name must be unique.
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name: string;
    hex: string;
    active?: boolean;
    sortOrder?: number;
  };

  if (!body.name || !body.hex) {
    return NextResponse.json(
      { error: "Name and hex are required." },
      { status: 400 }
    );
  }

  const name = String(body.name).trim();
  const hex = String(body.hex).trim();
  if (name.length === 0 || hex.length === 0) {
    return NextResponse.json(
      { error: "Name and hex cannot be empty." },
      { status: 400 }
    );
  }

  const existing = await db.color.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json(
      { error: "A color with this name already exists." },
      { status: 409 }
    );
  }

  const color = await db.color.create({
    data: {
      name,
      hex,
      active: body.active ?? true,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json({ ok: true, color });
}
