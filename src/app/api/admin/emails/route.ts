import { NextResponse } from "next/server";
import { getEmailLog } from "@/lib/email";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/emails — list sent emails (admin only, dev QA)
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ emails: getEmailLog() });
}
