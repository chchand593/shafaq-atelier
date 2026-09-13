import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// PATCH /api/admin/colors/[id] — update any color fields.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as Partial<{
    name: string;
    hex: string;
    active: boolean;
    sortOrder: number;
  }>;

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.hex !== undefined) data.hex = String(body.hex).trim();
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.sortOrder !== undefined) data.sortOrder = Math.round(Number(body.sortOrder));

  if (data.name === "") {
    return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
  }
  if (data.hex === "") {
    return NextResponse.json({ error: "Hex cannot be empty." }, { status: 400 });
  }

  // If renaming, ensure the new name does not collide with another color.
  if (typeof data.name === "string") {
    const collision = await db.color.findFirst({
      where: { name: data.name, NOT: { id } },
    });
    if (collision) {
      return NextResponse.json(
        { error: "A color with this name already exists." },
        { status: 409 }
      );
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const color = await db.color.update({ where: { id }, data });
  return NextResponse.json({ ok: true, color });
}

// DELETE /api/admin/colors/[id] — delete the color by id.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db.color.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
