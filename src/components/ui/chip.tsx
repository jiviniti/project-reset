import type { ButtonHTMLAttributes } from "react";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected: boolean;
  tone?: "dark" | "light";
};

export function Chip({ selected, tone = "light", className = "", ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`chip chip--${tone} ${selected ? "chip--selected" : ""} ${className}`}
      {...props}
    />
  );
}
