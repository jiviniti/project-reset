export function ResetBrand({ light = false }: { light?: boolean }) {
  return (
    <div className={`reset-brand${light ? " reset-brand--light" : ""}`} aria-label="Project RESET">
      <span className="reset-brand__project">Project</span>
      <span className="reset-brand__word"><b>re</b>set<b>.</b></span>
      <span className="reset-brand__tagline">Choose Better. Together.</span>
    </div>
  );
}

export function BrandedReset({
  uppercase = false,
  className = "",
}: {
  uppercase?: boolean;
  className?: string;
}) {
  const label = uppercase ? "RESET" : "reset";
  return (
    <span className={`branded-reset ${className}`.trim()} aria-label={label}>
      <span aria-hidden="true"><b>{uppercase ? "RE" : "re"}</b>{uppercase ? "SET" : "set"}</span>
    </span>
  );
}
