import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// PATCH /api/account/profile — update the signed-in user's name + email
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email } = (await request.json()) as {
    name?: string;
    email?: string;
  };

  const currentUser = await db.user.findUnique({
    where: { email: session.user.email },
  });
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // If email is changing, check uniqueness
  if (email && email.toLowerCase() !== currentUser.email) {
    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "That email is already in use." },
        { status: 409 }
      );
    }
  }

  const updated = await db.user.update({
    where: { id: currentUser.id },
    data: {
      name: name?.trim() || currentUser.name,
      email: email ? email.toLowerCase().trim() : currentUser.email,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json({ ok: true, user: updated });
}
