import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/abaya-styles — customer-facing abaya style catalog. Only active
// styles are returned, each with its images ordered by sortOrder. All image
// fields are included so the storefront gallery can render angle/label/primary
// and apply colorHex-based previews. No auth required.
//
// Robustness: wrapped in try/catch — returns `{ styles: [] }` (200) on any
// unexpected error so the Custom Abaya builder renders an empty style list
// instead of an error page.
export async function GET() {
  try {
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
  } catch (e) {
    console.error("[/api/abaya-styles] error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ styles: [] });
  }
}
