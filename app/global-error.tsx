"use client";

import { useEffect } from "react";
import { RouteErrorState } from "@/components/core/route-error-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GLOBAL APP ERROR]", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans text-foreground">
        <RouteErrorState
          title="ELEV8.AI needs a clean re-entry."
          description="A top-level runtime failure interrupted the app shell. Refresh the experience and the platform will attempt a clean recovery."
          onRetry={reset}
        />
      </body>
    </html>
  );
}
