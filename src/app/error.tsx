"use client";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState title="Something went wrong" action={<Button onClick={reset}>Try again</Button>}>
      We couldn&apos;t load this page. Check your connection and try again.
    </EmptyState>
  );
}
