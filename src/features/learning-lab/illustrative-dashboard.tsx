"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  publicAggregateSnapshotSchema,
  type PublicAggregateMetric,
  type PublicAggregateSnapshot,
} from "@/lib/validation/aggregate";
import { subscribeToAggregateRevision } from "@/services/aggregates/realtime";

type LoadState = "loading" | "ready" | "stale";

const categoryColors = {
  emotions: ["#de5240", "#fa8757", "#edbaa6", "#9d4b4f"],
  pathways: ["#458284", "#82bcc8", "#de5240", "#fa8757", "#d4953b"],
  practices: ["#458284", "#82bcc8", "#d4953b", "#fa8757"],
} as const;

function BubbleCloud({
  metrics,
  category,
}: {
  metrics: PublicAggregateMetric[];
  category: keyof typeof categoryColors;
}) {
  const ordered = useMemo(
    () => [...metrics].sort((left, right) => right.combined - left.combined || left.label.localeCompare(right.label)),
    [metrics],
  );
  const maximum = Math.max(...ordered.map((metric) => metric.combined), 1);

  return (
    <div className={`bubble-cloud bubble-cloud--${category}`}>
      {ordered.map((metric, index) => {
        const ratio = Math.sqrt(metric.combined / maximum);
        const diameter = Math.round(76 + ratio * 82);
        const color = categoryColors[category][index % categoryColors[category].length];
        return (
          <div
            className="aggregate-bubble"
            key={`${category}:${metric.key}`}
            style={{
              "--bubble-size": `${diameter}px`,
              "--bubble-color": color,
              "--bubble-delay": `${(index % 8) * 35}ms`,
            } as CSSProperties}
            aria-label={`${metric.label}: ${metric.combined.toLocaleString()} combined, including ${metric.observed.toLocaleString()} observed`}
          >
            <strong>{metric.label}</strong>
            <span>{metric.combined.toLocaleString()}</span>
            {metric.observed > 0 && <small>+{metric.observed.toLocaleString()} shared</small>}
          </div>
        );
      })}
    </div>
  );
}

export function IllustrativeDashboard({ onContribute }: { onContribute: () => void }) {
  const [snapshot, setSnapshot] = useState<PublicAggregateSnapshot | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/aggregates", { cache: "no-store" });
      if (!response.ok) throw new Error("aggregate_unavailable");
      const parsed = publicAggregateSnapshotSchema.parse(await response.json());
      setSnapshot(parsed);
      setLoadState("ready");
    } catch {
      setLoadState((current) => (current === "loading" ? "stale" : current));
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => void refresh(), 180);
  }, [refresh]);

  useEffect(() => {
    scheduleRefresh();
    const unsubscribe = subscribeToAggregateRevision(scheduleRefresh);

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      unsubscribe();
    };
  }, [refresh, scheduleRefresh]);

  if (!snapshot) {
    return (
      <div className="dashboard dashboard--loading">
        <section className="dashboard__section dashboard__section--dark">
          <p className="eyebrow eyebrow--orange">The community picture</p>
          <h2>{loadState === "loading" ? "gathering every RESET…" : "the picture is taking a moment."}</h2>
          <p>{loadState === "stale" ? "Please try again—the check-in remains available." : "Building the cumulative view."}</p>
          {loadState === "stale" && <button type="button" className="button button--light" onClick={() => void refresh()}>Try again</button>}
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard" data-revision={snapshot.revision}>
      <section className="dashboard__intro">
        <p className="eyebrow eyebrow--orange">Project RESET · live cumulative view</p>
        <h2>every answer changes the picture.</h2>
        <p className="dashboard__observed-total">
          <strong>{snapshot.totals.observed.toLocaleString()}</strong>
          <span>people have shared their RESET</span>
        </p>
        <p>The bubbles update as committed responses arrive from screenings and programs.</p>
      </section>

      <section className="dashboard__section dashboard__section--dark">
        <p className="eyebrow eyebrow--orange">How burnout shows up</p>
        <h2>this is what it feels like.</h2>
        <BubbleCloud metrics={snapshot.metrics.emotions} category="emotions" />
      </section>

      <section className="dashboard__section dashboard__section--peach">
        <p className="eyebrow">RESET pathways</p>
        <h2>where we begin again.</h2>
        <BubbleCloud metrics={snapshot.metrics.pathways} category="pathways" />
      </section>

      <section className="dashboard__section dashboard__section--light">
        <p className="eyebrow">What helps</p>
        <h2>the practices we return to.</h2>
        <BubbleCloud metrics={snapshot.metrics.practices} category="practices" />
      </section>

      <aside className="dashboard__seed-note">
        <strong>About the starting picture</strong>
        <p>
          The visual begins with a clearly marked illustrative prototype baseline of {snapshot.totals.seeded.toLocaleString()} entries. It is not collected participant data. The {snapshot.totals.observed.toLocaleString()} observed responses are counted separately and grow live.
        </p>
      </aside>

      <section className="dashboard__section dashboard__section--coral">
        <h2>add your RESET.</h2>
        <p>The picture grows because people answer.</p>
        <button type="button" className="button button--light" onClick={onContribute}>Contribute your RESET</button>
      </section>
    </div>
  );
}
