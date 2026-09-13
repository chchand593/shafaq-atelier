import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// PATCH /api/admin/fabrics/[id] — update any fabric fields.
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
    description: string;
    additionalPrice: number;
    themeValue: string;
    active: boolean;
    sortOrder: number;
  }>;

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.description !== undefined) data.description = String(body.description);
  if (body.additionalPrice !== undefined) data.additionalPrice = Math.round(Number(body.additionalPrice));
  if (body.themeValue !== undefined) data.themeValue = String(body.themeValue);
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.sortOrder !== undefined) data.sortOrder = Math.round(Number(body.sortOrder));

  if (data.name === "") {
    return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
  }

  // If renaming, ensure the new name does not collide with another fabric.
  if (typeof data.name === "string") {
    const collision = await db.fabric.findFirst({
      where: { name: data.name, NOT: { id } },
    });
    if (collision) {
      return NextResponse.json(
        { error: "A fabric with this name already exists." },
        { status: 409 }
      );
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const fabric = await db.fabric.update({ where: { id }, data });
  return NextResponse.json({ ok: true, fabric });
}

// DELETE /api/admin/fabrics/[id] — delete the fabric by id.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db.fabric.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
