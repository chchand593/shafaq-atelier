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
// ACCESS STRATEGY: We always request access: "public" because the
// reference image must be viewable by the admin when reviewing the custom
// order. If the Blob Store is private, the SDK throws — we detect it and
// return a clear, actionable error. We do NOT fall back to "private"
// because the admin wouldn't be able to view the image.
//
// Limits: max 5 MB, image/* only.
// Response (200): { ok: true, url, filename, size }
// Response (400): { ok: false, error: "No file provided" | "Only image files" }
// Response (413): { ok: false, error: "File too large (max 5MB)" }
// Response (500): { ok: false, error: "Blob storage is not configured..." }

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Detect the "private store" error from the @vercel/blob SDK.
function isPrivateStoreError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("cannot use public access") &&
    lower.includes("private")
  );
}

function privateStoreErrorMessage(): string {
  return (
    "Image upload is temporarily unavailable. The Vercel Blob Store is " +
    "configured as private. Please contact the store administrator to " +
    "change the Blob Store access to 'Public' in the Vercel dashboard " +
    "(Storage tab → click the store → Settings → Access → Public). " +
    "Then retry uploading your reference image."
  );
}

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

  // 2. Upload to Vercel Blob with access: "public".
  // The SDK auto-detects VERCEL_OIDC_TOKEN + BLOB_STORE_ID from env.
  // We request "public" access so the admin can view the reference image
  // when reviewing the custom order. If the store is private, we detect
  // the error and return a clear message.
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

    // Detect the "private store" error and return a clear, actionable
    // message instead of the raw SDK error.
    if (isPrivateStoreError(msg)) {
      return NextResponse.json(
        {
          ok: false,
          error: privateStoreErrorMessage(),
          errorCode: "BLOB_STORE_IS_PRIVATE",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: false, error: `Upload failed: ${msg}` },
      { status: 500 }
    );
  }
}
