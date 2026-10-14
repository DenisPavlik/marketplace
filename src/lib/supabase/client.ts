import { createBrowserClient } from "@supabase/ssr";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

/**
 * Subscribes once the Realtime socket carries the user's JWT. Without this the socket can
 * connect with the anonymous key before the cookie session loads, and RLS filters out
 * every postgres_changes event. Returns a cleanup function.
 */
export function subscribeAuthed(
  supabase: SupabaseClient<Database>,
  build: () => RealtimeChannel,
  onReady?: (channel: RealtimeChannel) => void,
): () => void {
  let channel: RealtimeChannel | null = null;
  let cancelled = false;

  supabase.auth.getSession().then(async ({ data }) => {
    if (cancelled) return;
    if (data.session) await supabase.realtime.setAuth(data.session.access_token);
    if (cancelled) return;
    channel = build().subscribe((status, err) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn(`[realtime] ${channel?.topic}: ${status}`, err?.message ?? "");
      }
    });
    onReady?.(channel);
  });

  return () => {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}
