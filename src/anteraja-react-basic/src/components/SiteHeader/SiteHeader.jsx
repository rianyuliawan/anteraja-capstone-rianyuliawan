export function SiteHeader({ onHome }) {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex min-h-18 w-[min(100%-2rem,76rem)] items-center justify-between gap-4">
        <button
          type="button"
          onClick={onHome}
          aria-label="Anteraja Frozen — beranda"
        >
          <img
            src="/images/logo-anteraja.png"
            alt="Anteraja"
            width="125"
            height="42"
            className="h-auto w-31"
          />
        </button>
        <nav aria-label="Bantuan">
          <a
            href="#customer-care"
            className="inline-flex min-h-11 items-center rounded-full px-3 py-2 text-sm font-bold text-ink-700 hover:bg-brand-50 hover:text-brand-700 sm:px-4"
          >
            Pusat Bantuan
          </a>
        </nav>
      </div>
    </header>
  );
}
