"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * App-level error boundary. Catches runtime errors in any server/client
 * component rendered inside the app shell. Shows a friendly error message
 * with a retry button instead of a blank white screen.
 *
 * Next.js App Router automatically uses this file as the error boundary
 * for the root layout segment.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-7" />
      </span>
      <div className="max-w-md">
        <h1 className="font-serif text-2xl font-medium">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred. Please try again — if the problem
          persists, refresh the page or contact support.
        </p>
        {process.env.NODE_ENV === "development" && error.message ? (
          <pre className="mt-4 max-h-40 overflow-auto rounded-lg border bg-secondary p-3 text-left text-xs text-muted-foreground">
            {error.message}
          </pre>
        ) : null}
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} className="rounded-full">
          <RefreshCw className="size-4" />
          Try again
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <a href="/">Go home</a>
        </Button>
      </div>
    </div>
  );
}
