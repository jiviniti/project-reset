import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing">
      <div className="landing__card">
        <p className="eyebrow">Project RESET · Learning Lab</p>
        <h1>Every screening has its own RESET link.</h1>
        <p>This environment currently contains the approved preview screening.</p>
        <Link className="button button--primary" href="/s/preview-screening">
          Open preview screening
        </Link>
      </div>
    </main>
  );
}
