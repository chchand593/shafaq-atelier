import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// PATCH /api/admin/abaya-images/[id] — update any image fields. If setting
// isPrimary=true, all sibling images of the same style are un-set as primary
// so only one hero image remains per style. colorHex accepts null to clear the
// color link.
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
    url: string;
    angle: string;
    label: string;
    isPrimary: boolean;
    colorHex: string | null;
    sortOrder: number;
  }>;

  const data: Record<string, unknown> = {};
  if (body.url !== undefined) data.url = String(body.url).trim();
  if (body.angle !== undefined) data.angle = String(body.angle);
  if (body.label !== undefined) data.label = String(body.label);
  if (body.isPrimary !== undefined) data.isPrimary = Boolean(body.isPrimary);
  if (body.sortOrder !== undefined) data.sortOrder = Math.round(Number(body.sortOrder));
  if (body.colorHex !== undefined) {
    const v = body.colorHex === null ? "" : String(body.colorHex).trim();
    data.colorHex = v.length > 0 ? v : null;
  }

  if (data.url === "") {
    return NextResponse.json({ error: "URL cannot be empty." }, { status: 400 });
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  // Look up the image first so we can find its sibling set when toggling primary.
  const existing = await db.abayaImage.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  // Enforce single primary per style: clear isPrimary on siblings.
  if (data.isPrimary === true) {
    await db.abayaImage.updateMany({
      where: { abayaStyleId: existing.abayaStyleId, isPrimary: true, NOT: { id } },
      data: { isPrimary: false },
    });
  }

  const image = await db.abayaImage.update({ where: { id }, data });
  return NextResponse.json({ ok: true, image });
}

// DELETE /api/admin/abaya-images/[id] — delete the image by id.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db.abayaImage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
