import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/fabrics — list all fabrics (including inactive), admin only.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fabrics = await db.fabric.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ fabrics });
}

// POST /api/admin/fabrics — create a fabric. Name must be unique.
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name: string;
    description?: string;
    additionalPrice?: number;
    themeValue?: string;
    active?: boolean;
    sortOrder?: number;
  };

  if (!body.name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const name = String(body.name).trim();
  if (name.length === 0) {
    return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
  }

  const existing = await db.fabric.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json(
      { error: "A fabric with this name already exists." },
      { status: 409 }
    );
  }

  const fabric = await db.fabric.create({
    data: {
      name,
      description: body.description ?? "",
      additionalPrice: body.additionalPrice ?? 0,
      themeValue: body.themeValue ?? "",
      active: body.active ?? true,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json({ ok: true, fabric });
}
