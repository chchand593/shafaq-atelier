import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/abaya-styles — customer-facing abaya style catalog. Only active
// styles are returned, each with its images ordered by sortOrder. All image
// fields are included so the storefront gallery can render angle/label/primary
// and apply colorHex-based previews. No auth required.
export async function GET() {
  const styles = await db.abayaStyle.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      sortOrder: true,
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          url: true,
          angle: true,
          label: true,
          isPrimary: true,
          colorHex: true,
          sortOrder: true,
        },
      },
    },
  });

  return NextResponse.json({ styles });
}
