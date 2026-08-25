"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function subscribeToAggregateRevision(onRevisionChanged: () => void): () => void {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) return () => undefined;

  const channel = supabase
    .channel("project-reset-aggregate-revision")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "aggregate_revision" },
      onRevisionChanged,
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") onRevisionChanged();
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}
