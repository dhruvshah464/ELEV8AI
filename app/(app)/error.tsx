"use client";

import { useEffect } from "react";
import { RouteErrorState } from "@/components/core/route-error-state";

export default function AppSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[APP SEGMENT ERROR]", error);
  }, [error]);

  return (
    <RouteErrorState
      title="Your command center hit an unexpected edge case."
      description="We kept the session intact. Reload the experience and you should be back inside your workspace without losing your place."
      onRetry={reset}
    />
  );
}
