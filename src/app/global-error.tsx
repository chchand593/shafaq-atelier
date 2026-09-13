"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * Global error boundary — catches errors that escape the root layout
 * itself (e.g. root layout throws). This is the last line of defense
 * before the user sees a blank page.
 *
 * Must render its own <html> and <body> tags since the root layout
 * is not used when this boundary triggers.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#fafafa",
          color: "#1a1a1a",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            padding: "16px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(220, 38, 38, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#dc2626",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div style={{ maxWidth: 400 }}>
            <h1 style={{ fontSize: 24, fontWeight: 500, margin: 0 }}>
              Something went wrong
            </h1>
            <p
              style={{
                marginTop: 8,
                fontSize: 14,
                color: "#71717a",
              }}
            >
              An unexpected error occurred. Please try refreshing the page.
            </p>
          </div>
          <button
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              borderRadius: 9999,
              border: "1px solid #e4e4e7",
              background: "#fff",
              color: "#1a1a1a",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Try again
          </button>
          <a
            href="/"
            style={{
              color: "#71717a",
              fontSize: 14,
              textDecoration: "underline",
            }}
          >
            Go to homepage
          </a>
        </div>
      </body>
    </html>
  );
}
