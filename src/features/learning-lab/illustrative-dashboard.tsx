"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ResetBrand } from "@/components/brand/reset-brand";
import { publicAggregateSnapshotSchema, type PublicAggregateMetric, type PublicAggregateSnapshot } from "@/lib/validation/aggregate";
import { subscribeToAggregateRevision } from "@/services/aggregates/realtime";

type LoadState = "loading" | "ready" | "stale";
type MetricCategory = "emotions" | "practices";
const DONATION_URL = process.env.NEXT_PUBLIC_DONATE_URL ?? "https://thirddegreeburnout.com/donate";
const categoryColors = {
  emotions: ["#f18262", "#dfa38f", "#b8655c", "#f3c8b8", "#93474d"],
  practices: ["#286b72", "#448d91", "#d4933e", "#ef805b", "#7ab6bb"],
} as const;

function WordCloud({ metrics, category }: { metrics: PublicAggregateMetric[]; category: MetricCategory }) {
  const ordered = useMemo(
    () => [...metrics].filter((metric) => metric.combined > 0).sort((left, right) => right.combined - left.combined || left.label.localeCompare(right.label)),
    [metrics],
  );
  const maximum = Math.max(...ordered.map((metric) => metric.combined), 1);
  return (
    <div className={`word-cloud word-cloud--${category}`}>
      {ordered.map((metric, index) => {
        const ratio = Math.sqrt(metric.combined / maximum);
        return <span className="aggregate-word" key={`${category}:${metric.key}`} style={{ "--word-size": `${0.82 + ratio * 1.62}rem`, "--word-color": categoryColors[category][index % categoryColors[category].length], "--word-delay": `${(index % 9) * 90}ms` } as CSSProperties} aria-label={`${metric.label}: ${metric.combined.toLocaleString()} combined, including ${metric.observed.toLocaleString()} observed`}>{metric.label}</span>;
      })}
    </div>
  );
}

function metricPercent(metrics: PublicAggregateMetric[], key: string, total: number) {
  const count = metrics.find((metric) => metric.key === key)?.combined ?? 0;
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

export function IllustrativeDashboard({
  onContribute,
  mode = "standalone",
}: {
  onContribute?: () => void;
  mode?: "standalone" | "post_submission";
}) {
  const [snapshot, setSnapshot] = useState<PublicAggregateSnapshot | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/aggregates", { cache: "no-store" });
      if (!response.ok) throw new Error("aggregate_unavailable");
      setSnapshot(publicAggregateSnapshotSchema.parse(await response.json()));
      setLoadState("ready");
    } catch {
      setLoadState((current) => current === "loading" ? "stale" : current);
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
  }, [scheduleRefresh]);

  if (!snapshot) {
    return <div className="dashboard dashboard--loading"><section className="dashboard__section dashboard__section--dark"><p className="eyebrow eyebrow--orange">The community picture</p><h2>{loadState === "loading" ? "Gathering every RESET…" : "The picture is taking a moment."}</h2><p>{loadState === "stale" ? "Please try again—the check-in remains available." : "Building the cumulative view."}</p>{loadState === "stale" && <button type="button" className="button button--light" onClick={() => void refresh()}>Try again</button>}</section></div>;
  }

  const total = snapshot.totals.combined;
  const stats = [
    { value: total.toLocaleString(), label: "illustrative baseline + observed responses" },
    { value: `${metricPercent(snapshot.metrics.practices, "eating_more_plants", total)}%`, label: "choose more plant-based foods" },
    { value: `${metricPercent(snapshot.metrics.practices, "walking", total)}%`, label: "choose walking" },
    { value: `${metricPercent(snapshot.metrics.emotions, "overwhelmed", total)}%`, label: "name feeling overwhelmed" },
  ];

  if (mode === "post_submission") {
    return (
      <div className="dashboard dashboard--post-submission" data-revision={snapshot.revision}>
        <section className="dashboard__section dashboard__section--dark">
          <p className="section-number">01</p>
          <p className="eyebrow eyebrow--orange">The burnout landscape</p>
          <h2>This is what it feels like.</h2>
          <p>The larger the word, the more often it appears in the cumulative picture.</p>
          <WordCloud metrics={snapshot.metrics.emotions} category="emotions" />
        </section>

        <section className="dashboard__section dashboard__section--cream">
          <p className="section-number">02</p>
          <p className="eyebrow">The community RESET map</p>
          <h2>What brings us back.</h2>
          <p>Shared practices become a collective map of recovery and reconnection.</p>
          <WordCloud metrics={snapshot.metrics.practices} category="practices" />
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard" data-revision={snapshot.revision}>
      <header className="dashboard-nav">
        <span>The Learning Lab</span>
        <button type="button" onClick={onContribute}>Take the Check-In</button>
      </header>
      <section className="dashboard__intro">
        <ResetBrand light />
        <p className="eyebrow eyebrow--orange">The Learning Lab · illustrative preview</p>
        <h2>Every answer changes the picture.</h2>
        <p>A living portrait of how burnout shows up—and the practices helping a community find its way back.</p>
      </section>

      <section className="dashboard__section dashboard__section--dark">
        <p className="section-number">01</p><p className="eyebrow eyebrow--orange">The burnout landscape</p><h2>This is what it feels like.</h2><p>The larger the word, the more often it appears in the cumulative picture.</p>
        <WordCloud metrics={snapshot.metrics.emotions} category="emotions" />
      </section>

      <section className="dashboard__section dashboard__section--cream">
        <p className="section-number">02</p><p className="eyebrow">The community RESET map</p><h2>What brings us back.</h2><p>Shared practices become a collective map of recovery and reconnection.</p>
        <WordCloud metrics={snapshot.metrics.practices} category="practices" />
      </section>

      <section className="dashboard__section dashboard__section--coral-soft">
        <p className="section-number">03</p><p className="eyebrow">Growing together</p><h2>The picture in numbers.</h2>
        <div className="community-stats">{stats.map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div>
        <aside className="dashboard__seed-note"><strong>About the starting picture</strong><p>The visual starts with {snapshot.totals.seeded.toLocaleString()} illustrative demo entries from the approved prototype—not verified Project RESET participants. The {snapshot.totals.observed.toLocaleString()} observed check-ins remain structurally separate and grow live.</p></aside>
      </section>

      <section className="dashboard__section dashboard__section--light pathway-section">
        <p className="section-number">04</p><p className="eyebrow">Five pathways</p><h2>Where we begin again.</h2>
        <div className="pathway-blooms">{snapshot.metrics.pathways.map((metric, index) => {
          const percent = total > 0 ? Math.min(100, Math.round((metric.combined / total) * 100)) : 0;
          return <div className="pathway-bloom" key={metric.key} style={{ "--bloom-color": ["#286b72", "#7ab6bb", "#dc5743", "#ef805b", "#d4933e"][index % 5], "--bloom-scale": `${0.4 + Math.sqrt(percent / 100) * 0.6}` } as CSSProperties}><span><strong>{percent}%</strong></span><b>{metric.label}</b></div>;
        })}</div>
      </section>

      <section className="dashboard__section dashboard__section--coral dashboard__cta">
        <p className="script-line script-line--white">Your answer belongs here.</p><h2>Add your RESET.</h2><p>The picture grows because people choose to share.</p>
        <button type="button" className="button button--light" onClick={onContribute}>Contribute your RESET <span aria-hidden="true">→</span></button>
        <a href={DONATION_URL} target="_blank" rel="noreferrer">Support the project</a>
      </section>

      <footer className="dashboard__footer">
        <p className="dashboard__footer-label">Brought to you by</p>
        <div className="dashboard__footer-lockup">
          <Image className="dashboard__footer-jiviniti" src="/images/jiviniti-wordmark.png" alt="JIVINITI" width={112} height={52} />
          <span>in partnership with</span>
          <Image className="dashboard__footer-picture-motion" src="/images/picture-motion.jpg" alt="Picture Motion" width={54} height={54} />
        </div>
        <p>Public results are aggregated and de-identified. Free text, custom tags, participant identifiers, and demographics are never shown here.</p>
      </footer>
    </div>
  );
}
