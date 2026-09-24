import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// POST /api/admin/upload
//
// Admin-only image upload via Vercel Blob. Multipart form-data with a
// single "file" field (an image, max 10MB). Returns the public Blob URL
// so the admin can save it on the product / color / abaya style.
//
// AUTHENTICATION: Vercel OIDC (no BLOB_READ_WRITE_TOKEN required).
// When a Blob store is connected to the Vercel project via OIDC, Vercel
// auto-sets BLOB_STORE_ID + VERCEL_OIDC_TOKEN as environment variables.
// The @vercel/blob SDK (v2.8.0+) automatically detects these and handles
// authentication internally — no explicit token is needed in the code.
//
// CRITICAL: This route does NOT fall back to the local filesystem.
// Vercel serverless functions have a read-only filesystem.
//
// Response (200): { ok: true, url, filename, contentType, size, storage }
// Response (401): { ok: false, error: "Unauthorized" }
// Response (400): { ok: false, error: "No file provided" }
// Response (413): { ok: false, error: "File too large (max 10MB)" }
// Response (500): { ok: false, error: "Blob storage is not configured..." }

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

  // 2. Check that Blob storage is configured.
  // Vercel OIDC sets BLOB_STORE_ID automatically when a Blob store is
  // connected. The @vercel/blob SDK reads VERCEL_OIDC_TOKEN + BLOB_STORE_ID
  // from the environment — no BLOB_READ_WRITE_TOKEN is needed.
  // For backwards compatibility, we also accept BLOB_READ_WRITE_TOKEN.
  const hasOidc = !!process.env.BLOB_STORE_ID;
  const hasLegacyToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  if (!hasOidc && !hasLegacyToken) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Blob storage is not configured. Go to Vercel → Project → Settings → Storage → connect a Blob Store. Vercel will automatically set BLOB_STORE_ID and VERCEL_OIDC_TOKEN. No BLOB_READ_WRITE_TOKEN is needed with OIDC.",
      },
      { status: 500 }
    );
  }

  // 3. Parse the multipart form.
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

  // 4. Validate type + size.
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

  // 5. Upload to Vercel Blob.
  // The SDK automatically uses VERCEL_OIDC_TOKEN + BLOB_STORE_ID from the
  // environment when BLOB_READ_WRITE_TOKEN is not set. No explicit token
  // is passed here — the SDK handles it internally.
  try {
    const { put } = await import("@vercel/blob");

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9]/g, "").substring(0, 5) || "jpg";
    const uniqueName = `uploads/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}.${safeExt}`;

    const blob = await put(uniqueName, file, {
      access: "public",
      addRandomSuffix: false,
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

export async function GET() {
  const hasOidc = !!process.env.BLOB_STORE_ID;
  const hasLegacyToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  return NextResponse.json(
    {
      ok: true,
      endpoint: "/api/admin/upload",
      method: "POST",
      contentType: "multipart/form-data",
      field: "file",
      maxBytes: MAX_BYTES,
      accepts: "image/*",
      storage: "vercel-blob",
      configured: hasOidc || hasLegacyToken,
      authMethod: hasOidc ? "oidc" : hasLegacyToken ? "legacy-token" : "none",
    },
    { status: 200 }
  );
}
