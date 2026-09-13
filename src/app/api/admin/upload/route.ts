import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// POST /api/admin/upload
// Accepts a multipart/form-data upload with a single file field named "file".
// Uploads to Vercel Blob storage and returns the public URL.
// Admin-only — non-admins get 401.
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Use form-data with a 'file' field." },
        { status: 400 }
      );
    }

    // Validate file type — only images allowed
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed." },
        { status: 400 }
      );
    }

    // Validate file size — max 10MB
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum 10MB." },
        { status: 400 }
      );
    }

    // Generate a unique filename with the original extension
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `products/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("[upload] Error:", error);
    const message =
      error instanceof Error ? error.message : "Upload failed.";

    // If the error is about missing BLOB_READ_WRITE_TOKEN, give a helpful hint
    if (message.includes("BLOB_READ_WRITE_TOKEN") || message.includes("token")) {
      return NextResponse.json(
        {
          error:
            "BLOB_READ_WRITE_TOKEN is not configured. Add it in Vercel → Settings → Environment Variables.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
