import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  publicAggregateSnapshotSchema,
  type PublicAggregateSnapshot,
} from "@/lib/validation/aggregate";

export class AggregateSnapshotError extends Error {
  constructor(public readonly safeCode: "aggregate_unavailable" | "aggregate_contract_invalid") {
    super(safeCode);
  }
}

export async function getPublicAggregateSnapshot(): Promise<PublicAggregateSnapshot> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_public_aggregates_v1");

  if (error || !data) {
    throw new AggregateSnapshotError("aggregate_unavailable");
  }

  const parsed = publicAggregateSnapshotSchema.safeParse(data);
  if (!parsed.success) {
    throw new AggregateSnapshotError("aggregate_contract_invalid");
  }

  return parsed.data;
}
