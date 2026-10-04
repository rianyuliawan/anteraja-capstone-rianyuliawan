export function Panel({
  as: Element = "section",
  children,
  className = "",
  ...props
}) {
  return (
    <Element
      className={`rounded-card border border-ink-200 bg-white p-5 shadow-card sm:p-6 ${className}`}
      {...props}
    >
      {children}
    </Element>
  );
}
