export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-ink-200 bg-white">
      <div className="mx-auto grid w-[min(100%-2rem,76rem)] gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <img
            src="/images/logo-anteraja.png"
            alt="Anteraja"
            width="115"
            height="39"
            className="mb-4 h-auto w-28"
          />
          <p className="text-sm leading-6 text-ink-600">
            Pelacakan pengiriman rantai dingin dengan informasi perjalanan dan
            suhu lingkungan aset yang mudah dipahami.
          </p>
        </div>
        <div>
          <h2 className="mb-3 text-xs font-extrabold tracking-wider text-ink-950 uppercase">
            Anteraja
          </h2>
          <a
            className="text-sm text-ink-600 hover:text-brand-700"
            href="https://anteraja.id/id/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Situs resmi Anteraja
          </a>
        </div>
        <div>
          <h2 className="mb-3 text-xs font-extrabold tracking-wider text-ink-950 uppercase">
            Bantuan
          </h2>
          <a
            className="text-sm text-ink-600 hover:text-brand-700"
            href="mailto:cs@anteraja.id"
          >
            Customer Care
          </a>
        </div>
        <div>
          <h2 className="mb-3 text-xs font-extrabold tracking-wider text-ink-950 uppercase">
            Hubungi kami
          </h2>
          <a
            className="text-sm text-ink-600 hover:text-brand-700"
            href="tel:+622150663333"
          >
            (021) 5066 3333
          </a>
          <p className="mt-1 text-sm text-ink-500">Setiap hari, 24 jam</p>
        </div>
      </div>
      <div className="border-t border-ink-200 py-5 text-center text-xs text-ink-500">
        © 2026 PT Tri Adi Bersama (Anteraja). Hak Cipta Dilindungi
        Undang-Undang.
      </div>
    </footer>
  );
}
