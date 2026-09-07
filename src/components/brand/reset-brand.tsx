import Image from "next/image";

export function ResetBrand({ light = false }: { light?: boolean }) {
  return (
    <div className={`reset-brand${light ? " reset-brand--light" : ""}`} aria-label="Project RESET">
      <span className="reset-brand__project">Project</span>
      <span className="reset-brand__word"><b>re</b>set<b>.</b></span>
      <span className="reset-brand__tagline">Choose Better. Together.</span>
    </div>
  );
}

export function PathwayStrip() {
  return (
    <div className="pathway-strip" aria-hidden="true">
      <span /><span /><span /><span /><span />
    </div>
  );
}

export function ProjectResetFooter({ showDataNote = true }: { showDataNote?: boolean }) {
  return (
    <>
      <footer className="dashboard__footer">
        <p className="dashboard__footer-label">Brought to you by</p>
        <div className="dashboard__footer-lockup">
          <Image className="dashboard__footer-jiviniti" src="/images/jiviniti-wordmark.png" alt="JIVINITI" width={112} height={52} />
          <span>in partnership with</span>
          <Image className="dashboard__footer-picture-motion" src="/images/picture-motion.jpg" alt="Picture Motion" width={54} height={54} />
        </div>
        {showDataNote ? <p>Public results are aggregated and de-identified. Free text, custom tags, participant identifiers, and demographics are never shown here.</p> : null}
      </footer>
      <PathwayStrip />
    </>
  );
}

export function BrandedReset({
  uppercase = false,
  className = "",
  period = false,
}: {
  uppercase?: boolean;
  className?: string;
  period?: boolean;
}) {
  const label = uppercase ? "RESET" : "reset";
  return (
    <span className={`branded-reset ${className}`.trim()} aria-label={label}>
      <span aria-hidden="true"><b>{uppercase ? "RE" : "re"}</b>{uppercase ? "SET" : "set"}{period ? <b className="branded-reset__period">.</b> : null}</span>
    </span>
  );
}
