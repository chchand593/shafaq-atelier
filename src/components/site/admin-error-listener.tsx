"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUI } from "@/lib/store";

/**
 * AdminErrorListener — a tiny client component mounted on the homepage that
 * watches for the `?admin_error=auth` or `?admin_error=denied` query params
 * emitted by `src/middleware.ts` when an unauthenticated or non-admin user
 * tries to visit `/admin`.
 *
 * Behavior:
 *   - On `admin_error=auth`: shows a toast "Please sign in as an admin…" and
 *     auto-opens the AuthModal so the user can sign in immediately.
 *   - On `admin_error=denied`: shows a toast "Your account does not have
 *     admin access." (does NOT auto-open the modal — they're already signed
 *     in, just not an admin).
 *   - In both cases: strips the query param from the URL after handling so
 *     it doesn't persist across navigation or appear in shared links.
 *
 * Renders nothing.
 */
export function AdminErrorListener() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthOpen } = useUI();
  const handledRef = React.useRef(false);

  React.useEffect(() => {
    if (handledRef.current) return;
    const err = searchParams.get("admin_error");
    if (!err) return;

    handledRef.current = true;

    if (err === "auth") {
      toast.error("Please sign in as an admin to continue.", {
        description: "You were redirected from the admin dashboard.",
      });
      // Open the auth modal so the user can sign in immediately.
      setAuthOpen(true);
    } else if (err === "denied") {
      toast.error("Your account does not have admin access.", {
        description: "If you believe this is a mistake, contact the store owner.",
      });
    }

    // Strip the query param so it doesn't persist.
    const url = new URL(window.location.href);
    url.searchParams.delete("admin_error");
    router.replace(url.pathname + (url.search ? url.search : ""), { scroll: false });
  }, [searchParams, router, setAuthOpen]);

  return null;
}

export default AdminErrorListener;
