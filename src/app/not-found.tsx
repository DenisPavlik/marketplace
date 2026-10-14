import { EmptyState } from "@/components/empty-state";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <EmptyState title="This page isn't here" action={<ButtonLink href="/">Back to browsing</ButtonLink>}>
      It may have been sold, removed, or the link is mistyped.
    </EmptyState>
  );
}
