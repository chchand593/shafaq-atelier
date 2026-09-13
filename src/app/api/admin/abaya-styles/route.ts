import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// Generate a URL-safe slug from a style name. Lowercases, collapses non-alphanum
// runs to hyphens, trims hyphens, and appends a short random suffix when needed
// to satisfy the @unique constraint without surfacing collisions to the admin.
function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "style";
}

// GET /api/admin/abaya-styles — list all abaya styles (including inactive),
// admin only. Each style includes its images ordered by sortOrder so the admin
// UI can render the full gallery without a second round-trip per style.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const styles = await db.abayaStyle.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  return NextResponse.json({ styles });
}

// POST /api/admin/abaya-styles — create a new abaya style. The slug is derived
// from the name; if a style with that slug already exists a short suffix is
// appended until the slug is unique. Name uniqueness is enforced by the schema
// (@unique), so a duplicate name returns 409.
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name: string;
    description?: string;
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

  const nameCollision = await db.abayaStyle.findUnique({ where: { name } });
  if (nameCollision) {
    return NextResponse.json(
      { error: "An abaya style with this name already exists." },
      { status: 409 }
    );
  }

  // Build a unique slug. Try the plain slugified name first, then append a
  // numeric suffix on collision.
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 2;
  while (await db.abayaStyle.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const style = await db.abayaStyle.create({
    data: {
      name,
      slug,
      description: body.description ?? "",
      active: body.active ?? true,
      sortOrder: body.sortOrder ?? 0,
    },
    include: { images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });

  return NextResponse.json({ ok: true, style });
}
