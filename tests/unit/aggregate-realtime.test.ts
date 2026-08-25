import { beforeEach, describe, expect, it, vi } from "vitest";

const removeChannel = vi.fn();
let databaseCallback: (() => void) | undefined;
let statusCallback: ((status: string) => void) | undefined;

const channel = {
  on: vi.fn((_type: string, _filter: unknown, callback: () => void) => {
    databaseCallback = callback;
    return channel;
  }),
  subscribe: vi.fn((callback: (status: string) => void) => {
    statusCallback = callback;
    return channel;
  }),
};

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({
    channel: vi.fn(() => channel),
    removeChannel,
  }),
}));

describe("aggregate realtime invalidation", () => {
  beforeEach(() => {
    databaseCallback = undefined;
    statusCallback = undefined;
    removeChannel.mockClear();
    channel.on.mockClear();
    channel.subscribe.mockClear();
  });

  it("subscribes only to revision updates, triggers a refetch signal and cleans up", async () => {
    const { subscribeToAggregateRevision } = await import("@/services/aggregates/realtime");
    const refresh = vi.fn();
    const unsubscribe = subscribeToAggregateRevision(refresh);

    expect(channel.on).toHaveBeenCalledWith(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "aggregate_revision" },
      refresh,
    );

    statusCallback?.("SUBSCRIBED");
    databaseCallback?.();
    expect(refresh).toHaveBeenCalledTimes(2);

    unsubscribe();
    expect(removeChannel).toHaveBeenCalledWith(channel);
  });
});
