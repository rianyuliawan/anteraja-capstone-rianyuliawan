const tones = {
  info: "bg-cold-100 text-cold-700",
  success: "bg-success-100 text-success-700",
  warning: "bg-warning-100 text-warning-800",
  danger: "bg-danger-100 text-danger-700",
  neutral: "bg-ink-100 text-ink-600",
};
export function StatusBadge({ children, tone = "info", className = "" }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold whitespace-nowrap ${tones[tone]} ${className}`}
    >
      <span
        className="size-1.5 shrink-0 rounded-full bg-current"
        aria-hidden="true"
      />
      {children}
    </span>
  );
}
