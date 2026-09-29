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
// ACCESS STRATEGY (production-safe):
// The @vercel/blob SDK `put()` REQUIRES an explicit `access` parameter —
// either "public" or "private". There is no default.
//
//   - access: "public"  → URL is `https://{storeId}.public.blob.vercel-storage.com/...`
//     The blob is permanently and publicly readable by anyone. This is
//     REQUIRED for customer-facing product images (the storefront <img>
//     tags load these URLs directly in the browser).
//   - access: "private" → URL is `https://{storeId}.private.blob.vercel-storage.com/...`
//     The blob is NOT publicly readable. Requires a signed token. Signed
//     tokens expire — so the image would disappear from the customer
//     storefront after the token expires. NOT suitable for product images.
//
// If the Vercel Blob Store is configured as "private" (the default for
// stores created after 2024-06), `put(..., { access: "public" })` throws:
//   "Vercel Blob: Cannot use public access on a private store. The store
//    is configured with private access."
//
// In that case, we return a CLEAR, actionable error to the admin telling
// them exactly how to fix it: change the Blob Store access to "public" in
// the Vercel dashboard. We do NOT silently fall back to `access: "private"`
// because private blobs would NOT display on the customer storefront
// (broken images), which is worse than a clear upload error.
//
// CRITICAL: This route does NOT fall back to the local filesystem.
// Vercel serverless functions have a read-only filesystem.
//
// Response (200): { ok: true, url, filename, contentType, size, storage }
// Response (401): { ok: false, error: "Unauthorized" }
// Response (400): { ok: false, error: "No file provided" }
// Response (413): { ok: false, error: "File too large (max 10MB)" }
// Response (500): { ok: false, error: "Blob storage is not configured..." | "...private store..." }

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_PREFIX = "image/";

// Detect the "private store" error from the @vercel/blob SDK. The server
// returns this message when `access: "public"` is used on a store that is
// configured with private access. We detect it case-insensitively and with
// some tolerance for the exact wording so future SDK versions still match.
function isPrivateStoreError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("cannot use public access") &&
    lower.includes("private")
  );
}

// Build a clear, actionable error message for the admin when the Blob Store
// is configured as private. This guides the user through the Vercel dashboard
// steps to change the store to public — without deleting or recreating it.
function privateStoreErrorMessage(): string {
  return (
    "The Vercel Blob Store is configured as PRIVATE. Product images need a " +
    "PUBLIC store so customers can view them in the browser. " +
    "FIX: Go to Vercel dashboard → your project → Storage tab → click the Blob " +
    "Store → Settings → change 'Access' from 'Private' to 'Public'. " +
    "This does NOT delete or recreate the store — it only changes the access " +
    "setting. Existing blobs will become publicly readable. Then retry the " +
    "upload. (Do NOT create a new store or delete the existing one.)"
  );
}

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

  // 5. Upload to Vercel Blob with access: "public".
  // The SDK automatically uses VERCEL_OIDC_TOKEN + BLOB_STORE_ID from the
  // environment when BLOB_READ_WRITE_TOKEN is not set. No explicit token
  // is passed here — the SDK handles it internally.
  //
  // We ALWAYS request access: "public" because customer-facing product
  // images must be publicly readable (the storefront <img> tags load these
  // URLs directly in the browser, with no auth). If the store is private,
  // the SDK throws a specific error — we detect it and return a clear,
  // actionable message guiding the admin to change the store to public.
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

    // Detect the "private store" error and return a clear, actionable
    // message instead of the raw SDK error. This is the ROOT CAUSE of the
    // reported "Upload failed: Vercel Blob: Cannot use public access on a
    // private store" error — the store is private, the code requests public.
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

    // All other errors (network, auth, quota, etc.) — return the raw message.
    return NextResponse.json(
      { ok: false, error: `Upload failed: ${msg}` },
      { status: 500 }
    );
  }
}

// GET /api/admin/upload — diagnostic endpoint. Reports the current Blob
// storage configuration so the admin can verify the setup without attempting
// an actual upload. Safe to call — does not perform any upload or write.
export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const hasOidc = !!process.env.BLOB_STORE_ID;
  const hasLegacyToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  const hasOidcToken = !!process.env.VERCEL_OIDC_TOKEN;
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
      env: {
        BLOB_STORE_ID: hasOidc ? "set" : "missing",
        VERCEL_OIDC_TOKEN: hasOidcToken ? "set" : "missing",
        BLOB_READ_WRITE_TOKEN: hasLegacyToken ? "set" : "missing",
      },
      // The SDK ALWAYS requires access: "public" or access: "private" on put().
      // We use "public" for customer-facing images. If the store is private,
      // uploads will fail with a clear error — see POST handler above.
      accessStrategy: "public",
      note:
        "If uploads fail with 'Cannot use public access on a private store', " +
        "change the Blob Store access to 'Public' in the Vercel dashboard " +
        "(Storage tab → click the store → Settings → Access → Public). " +
        "This does NOT delete or recreate the store.",
    },
    { status: 200 }
  );
}
