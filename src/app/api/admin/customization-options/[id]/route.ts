import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// PATCH /api/admin/customization-options/[id] — update any option fields.
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
    optionType: string;
    additionalPrice: number;
    active: boolean;
    sortOrder: number;
  }>;

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.description !== undefined) data.description = String(body.description);
  if (body.optionType !== undefined) data.optionType = String(body.optionType);
  if (body.additionalPrice !== undefined) data.additionalPrice = Math.round(Number(body.additionalPrice));
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.sortOrder !== undefined) data.sortOrder = Math.round(Number(body.sortOrder));

  if (data.name === "") {
    return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
  }
  if (typeof data.optionType === "string" && data.optionType === "") {
    return NextResponse.json({ error: "optionType cannot be empty." }, { status: 400 });
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const option = await db.customizationOption.update({ where: { id }, data });
  return NextResponse.json({ ok: true, option });
}

// DELETE /api/admin/customization-options/[id] — delete the option by id.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db.customizationOption.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
