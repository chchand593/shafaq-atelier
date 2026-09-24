import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/custom-abaya/upload-reference
//
// Public (no admin auth required — the customer is not logged in when
// designing a custom abaya). Uploads a reference/inspiration image to
// Vercel Blob so it can be stored as a URL in the OrderItem.customization
// JSON rather than a large base64 data URI.
//
// AUTHENTICATION: Vercel OIDC (no BLOB_READ_WRITE_TOKEN required).
// The @vercel/blob SDK auto-detects VERCEL_OIDC_TOKEN + BLOB_STORE_ID.
//
// Limits: max 5 MB, image/* only.
// Response (200): { ok: true, url, filename, size }
// Response (400): { ok: false, error: "No file provided" | "Only image files" }
// Response (413): { ok: false, error: "File too large (max 5MB)" }
// Response (500): { ok: false, error: "Blob storage is not configured..." }

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  // 1. Check that Blob storage is configured (OIDC or legacy token).
  const hasOidc = !!process.env.BLOB_STORE_ID;
  const hasLegacyToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  if (!hasOidc && !hasLegacyToken) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Image upload is not configured. Please contact us to complete your custom order.",
      },
      { status: 500 }
    );
  }

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

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { ok: false, error: "Only image files are allowed" },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "File too large (max 5MB)" },
      { status: 413 }
    );
  }

  // 2. Upload to Vercel Blob.
  // The SDK auto-detects VERCEL_OIDC_TOKEN + BLOB_STORE_ID from env.
  try {
    const { put } = await import("@vercel/blob");
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9]/g, "").substring(0, 5) || "jpg";
    const uniqueName = `custom-abaya-refs/${Date.now()}-${Math.random()
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
        filename: file.name,
        size: file.size,
      },
      { status: 200 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json(
      { ok: false, error: `Upload failed: ${msg}` },
      { status: 500 }
    );
  }
}
