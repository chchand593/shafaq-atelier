import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/abaya-styles/[id]/images — list all images for a style,
// ordered by sortOrder then createdAt for a stable, predictable gallery order.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const style = await db.abayaStyle.findUnique({ where: { id } });
  if (!style) {
    return NextResponse.json({ error: "Style not found." }, { status: 404 });
  }

  const images = await db.abayaImage.findMany({
    where: { abayaStyleId: id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ images });
}

// POST /api/admin/abaya-styles/[id]/images — add an image to a style. If
// isPrimary is true, all sibling images are un-set as primary first so only one
// image per style can be the hero/primary. If no sortOrder is provided we
// append the image at the end (max + 1).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    url: string;
    angle?: string;
    label?: string;
    isPrimary?: boolean;
    colorHex?: string | null;
    sortOrder?: number;
  };

  if (!body.url) {
    return NextResponse.json({ error: "Image URL is required." }, { status: 400 });
  }
  const url = String(body.url).trim();
  if (url.length === 0) {
    return NextResponse.json({ error: "Image URL cannot be empty." }, { status: 400 });
  }

  const style = await db.abayaStyle.findUnique({ where: { id } });
  if (!style) {
    return NextResponse.json({ error: "Style not found." }, { status: 404 });
  }

  const isPrimary = Boolean(body.isPrimary);
  const colorHexRaw = body.colorHex === undefined || body.colorHex === null
    ? null
    : String(body.colorHex).trim();
  const colorHex = colorHexRaw && colorHexRaw.length > 0 ? colorHexRaw : null;

  // If no explicit sortOrder was provided, append at the end.
  let sortOrder: number;
  if (body.sortOrder !== undefined && body.sortOrder !== null) {
    sortOrder = Math.round(Number(body.sortOrder));
  } else {
    const maxRow = await db.abayaImage.aggregate({
      where: { abayaStyleId: id },
      _max: { sortOrder: true },
    });
    sortOrder = (maxRow._max.sortOrder ?? -1) + 1;
  }

  // Enforce single primary per style: clear isPrimary on siblings when needed.
  if (isPrimary) {
    await db.abayaImage.updateMany({
      where: { abayaStyleId: id, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const image = await db.abayaImage.create({
    data: {
      abayaStyleId: id,
      url,
      angle: body.angle || "front",
      label: body.label ?? "",
      isPrimary,
      colorHex,
      sortOrder,
    },
  });

  return NextResponse.json({ ok: true, image });
}
