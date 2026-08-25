import { describe, expect, it } from "vitest";
import { publicAggregateSnapshotSchema } from "@/lib/validation/aggregate";

const safeSnapshot = {
  apiVersion: "1",
  snapshotVersion: 1,
  revision: 8,
  generatedAt: "2026-08-25T12:00:00+00:00",
  scope: "cumulative",
  suppression: { minimumObservedCellSize: 5, applied: false },
  totals: { seeded: 10, observed: 2, combined: 12 },
  metrics: {
    emotions: [{ key: "exhausted", label: "Exhausted", seeded: 4, observed: 1, combined: 5, suppressed: false }],
    pathways: [],
    practices: [],
  },
} as const;

describe("public aggregate contract", () => {
  it("accepts the cumulative allowlisted response", () => {
    expect(publicAggregateSnapshotSchema.parse(safeSnapshot)).toEqual(safeSnapshot);
  });

  it.each(["email", "participantId", "responseId", "freeText", "demographics", "consent"])(
    "rejects forbidden field %s",
    (field) => {
      expect(() => publicAggregateSnapshotSchema.parse({ ...safeSnapshot, [field]: "private" })).toThrow();
    },
  );

  it("rejects inconsistent combined values", () => {
    expect(() => publicAggregateSnapshotSchema.parse({
      ...safeSnapshot,
      totals: { seeded: 10, observed: 2, combined: 13 },
    })).toThrow();
  });
});
