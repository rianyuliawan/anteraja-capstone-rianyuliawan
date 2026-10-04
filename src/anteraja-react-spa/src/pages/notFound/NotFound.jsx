import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <section className="rounded-card border border-ink-200 bg-white p-8 text-center">
      <h1 className="text-2xl font-extrabold">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-sm text-ink-600">
        Alamat halaman mungkin berubah atau salah ketik.
      </p>
      <Link
        to="/"
        className="mt-4 inline-block font-bold text-brand-700 underline"
      >
        Kembali ke beranda
      </Link>
    </section>
  );
}
