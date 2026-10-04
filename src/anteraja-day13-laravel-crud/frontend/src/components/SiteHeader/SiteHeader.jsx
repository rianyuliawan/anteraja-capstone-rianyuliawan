import { Link } from "react-router-dom";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex min-h-18 w-[min(100%-2rem,76rem)] items-center justify-between gap-4">
        <Link to="/" aria-label="Anteraja Frozen — beranda">
          <img
            src="/images/logo-anteraja.png"
            alt="Anteraja"
            width="125"
            height="42"
            className="h-auto w-31"
          />
        </Link>
        <nav aria-label="Navigasi" className="flex items-center gap-2">
          <Link
            to="/admin"
            className="inline-flex min-h-11 items-center rounded-full px-3 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50"
          >
            Kelola Data
          </Link>
          <a
            href="#customer-care"
            className="inline-flex min-h-11 items-center rounded-full px-3 py-2 text-sm font-bold text-ink-700 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:px-4"
          >
            Pusat Bantuan
          </a>
        </nav>
      </div>
    </header>
  );
}
