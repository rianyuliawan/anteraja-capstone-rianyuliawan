const variants = {
  primary:
    "border-brand-500 bg-brand-500 text-white shadow-[0_8px_20px_rgb(237_6_119_/_0.18)] hover:border-brand-700 hover:bg-brand-700",
  secondary:
    "border-ink-200 bg-white text-ink-700 hover:border-brand-500 hover:text-brand-700",
  ghost:
    "border-transparent bg-transparent text-ink-700 hover:bg-brand-50 hover:text-brand-700",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
