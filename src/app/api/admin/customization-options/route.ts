import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/customization-options — list all options (including inactive),
// admin only. Ordered by optionType asc then sortOrder asc so grouped add-ons
// render in a stable order in the admin UI.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const options = await db.customizationOption.findMany({
    orderBy: [{ optionType: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json({ options });
}

// POST /api/admin/customization-options — create an add-on option.
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name: string;
    description?: string;
    optionType?: string;
    additionalPrice?: number;
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

  const option = await db.customizationOption.create({
    data: {
      name,
      description: body.description ?? "",
      optionType: body.optionType || "addon",
      additionalPrice: body.additionalPrice ?? 0,
      active: body.active ?? true,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json({ ok: true, option });
}
