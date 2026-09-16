import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// POST /api/admin/upload
//
// Admin-only image upload. Multipart form-data with a single "file" field
// (an image, max 10MB). The image is stored in Vercel Blob using the
// BLOB_READ_WRITE_TOKEN env var, and the public URL is returned so the
// admin can save it directly on the product / color / abaya style.
//
// Response (200): { ok: true, url, filename, contentType, size }
// Response (401): { ok: false, error: "Unauthorized" }
// Response (400): { ok: false, error: "No file provided" }
// Response (413): { ok: false, error: "File too large (max 10MB)" }
// Response (500): { ok: false, error: "Upload failed: ..." }
//
// Sandbox fallback: when BLOB_READ_WRITE_TOKEN is not set (e.g. local dev),
// the route writes the file into /public/uploads/ and returns a relative
// path so the admin can still test uploads end-to-end without Vercel Blob.

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_PREFIX = "image/";

export async function POST(request: Request) {
  // 1. Auth check — must be an admin.
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2. Parse the multipart form. FormData can be a Request body in Next 16.
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid form data" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "No file provided" },
      { status: 400 }
    );
  }

  // 3. Validate type + size.
  if (!file.type.startsWith(ALLOWED_MIME_PREFIX)) {
    return NextResponse.json(
      { ok: false, error: "Only image files are allowed" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "File too large (max 10MB)" },
      { status: 413 }
    );
  }

  // 4. Try Vercel Blob first; fall back to local /public/uploads in dev.
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (blobToken) {
    try {
      const { put } = await import("@vercel/blob");
      // Generate a unique filename to avoid collisions, but keep the
      // original extension so browsers can serve it with the right MIME.
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const safeExt = ext.replace(/[^a-z0-9]/g, "").substring(0, 5) || "jpg";
      const uniqueName = `uploads/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}.${safeExt}`;

      const blob = await put(uniqueName, file, {
        access: "public",
        addRandomSuffix: false,
        token: blobToken,
      });

      return NextResponse.json(
        {
          ok: true,
          url: blob.url,
          filename: uniqueName,
          contentType: file.type,
          size: file.size,
          storage: "vercel-blob",
        },
        { status: 200 }
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Blob upload failed";
      return NextResponse.json(
        { ok: false, error: `Upload failed: ${msg}` },
        { status: 500 }
      );
    }
  }

  // 5. Sandbox fallback — write to /public/uploads/.
  try {
    const { writeFile, mkdir } = await import("node:fs/promises");
    const path = await import("node:path");
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9]/g, "").substring(0, 5) || "jpg";
    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}.${safeExt}`;
    const filePath = path.join(uploadDir, uniqueName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return NextResponse.json(
      {
        ok: true,
        url: `/uploads/${uniqueName}`,
        filename: uniqueName,
        contentType: file.type,
        size: file.size,
        storage: "local",
      },
      { status: 200 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Local upload failed";
    return NextResponse.json(
      { ok: false, error: `Upload failed: ${msg}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      endpoint: "/api/admin/upload",
      method: "POST",
      contentType: "multipart/form-data",
      field: "file",
      maxBytes: MAX_BYTES,
      accepts: "image/*",
      storage:
        process.env.BLOB_READ_WRITE_TOKEN
          ? "vercel-blob"
          : "local (/public/uploads — sandbox fallback)",
    },
    { status: 200 }
  );
}
