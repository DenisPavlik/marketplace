import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";
import { SearchBox } from "@/components/header/search-box";
import { UserMenu } from "@/components/header/user-menu";
import { InboxLink } from "@/components/header/inbox-link";
import { getViewer } from "@/lib/auth";
import { getUnreadCount } from "@/lib/chat";

export async function Header() {
  const viewer = await getViewer();
  const unread = viewer ? await getUnreadCount() : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6">
        <Logo className="shrink-0" />
        <Suspense fallback={<div className="hidden h-11 flex-1 md:block" />}>
          <SearchBox className="mx-auto hidden max-w-xl flex-1 md:block" />
        </Suspense>
        <nav className="ml-auto flex items-center gap-2 md:ml-0">
          <ButtonLink href="/sell" size="md" className="max-sm:size-10 max-sm:px-0">
            <Plus className="size-[18px]" strokeWidth={2.5} />
            <span className="max-sm:sr-only">Sell</span>
          </ButtonLink>
          {viewer ? (
            <>
              <InboxLink initialCount={unread} userId={viewer.id} />
              <UserMenu viewer={viewer} />
            </>
          ) : (
            <ButtonLink href="/login" variant="ghost" size="md">
              Sign in
            </ButtonLink>
          )}
        </nav>
      </div>
      <div className="px-4 pb-3 md:hidden">
        <Suspense fallback={<div className="h-11" />}>
          <SearchBox />
        </Suspense>
      </div>
    </header>
  );
}
