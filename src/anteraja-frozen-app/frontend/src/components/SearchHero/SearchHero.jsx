import AwbSearchForm from "../AwbSearchForm";

export function SearchHero({ awbs, onSearch, onNotify }) {
  return (
    <section
      id="beranda"
      className="mx-auto max-w-3xl scroll-mt-24 py-6 text-center sm:py-10"
      aria-labelledby="page-title"
    >
      <p className="text-xs font-extrabold tracking-[0.14em] text-brand-700 uppercase">
        Anteraja Frozen
      </p>
      <h1
        id="page-title"
        className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl"
      >
        Pelacakan paket <span className="text-brand-700">cold chain</span> dalam
        satu tampilan
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-600 sm:text-base">
        {/* Masukkan hingga 10 nomor AWB, lalu pilih paket yang ingin dilihat lebih
        lengkap. */}
      </p>
      <div className="mt-7 text-left">
        <AwbSearchForm
          key={awbs.join(",")}
          initialAwbs={awbs}
          onSearch={onSearch}
          onNotify={onNotify}
        />
      </div>
    </section>
  );
}
