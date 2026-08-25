import { NextResponse } from "next/server";
import {
  AggregateSnapshotError,
  getPublicAggregateSnapshot,
} from "@/services/aggregates/get-public-aggregates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const correlationId = crypto.randomUUID();

  try {
    const snapshot = await getPublicAggregateSnapshot();
    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const code = error instanceof AggregateSnapshotError ? error.safeCode : "aggregate_unavailable";
    console.error("aggregate_snapshot_failed", { correlationId, code });
    return NextResponse.json(
      { error: "aggregate_unavailable", correlationId },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
