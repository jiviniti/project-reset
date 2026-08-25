import { z } from "zod";

const aggregateCount = z.number().int().nonnegative().safe();

export const publicAggregateMetricSchema = z
  .object({
    key: z.string().regex(/^[a-z0-9_]+$/).max(80),
    label: z.string().trim().min(1).max(120),
    seeded: aggregateCount,
    observed: aggregateCount,
    combined: aggregateCount,
    suppressed: z.boolean(),
  })
  .strict()
  .superRefine((metric, context) => {
    if (metric.combined !== metric.seeded + metric.observed) {
      context.addIssue({ code: "custom", message: "Combined count is inconsistent." });
    }
  });

export const publicAggregateSnapshotSchema = z
  .object({
    apiVersion: z.literal("1"),
    snapshotVersion: z.number().int().positive(),
    revision: aggregateCount,
    generatedAt: z.string().datetime({ offset: true }),
    scope: z.literal("cumulative"),
    suppression: z
      .object({
        minimumObservedCellSize: z.literal(5),
        applied: z.boolean(),
      })
      .strict(),
    totals: z
      .object({
        seeded: aggregateCount,
        observed: aggregateCount,
        combined: aggregateCount,
      })
      .strict(),
    metrics: z
      .object({
        emotions: z.array(publicAggregateMetricSchema).max(100),
        pathways: z.array(publicAggregateMetricSchema).max(100),
        practices: z.array(publicAggregateMetricSchema).max(100),
      })
      .strict(),
  })
  .strict()
  .superRefine((snapshot, context) => {
    if (snapshot.totals.combined !== snapshot.totals.seeded + snapshot.totals.observed) {
      context.addIssue({ code: "custom", message: "Combined participation total is inconsistent." });
    }
  });

export type PublicAggregateMetric = z.infer<typeof publicAggregateMetricSchema>;
export type PublicAggregateSnapshot = z.infer<typeof publicAggregateSnapshotSchema>;
