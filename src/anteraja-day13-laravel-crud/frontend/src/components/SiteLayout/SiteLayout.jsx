import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SiteHeader from "../SiteHeader";
import SiteFooter from "../SiteFooter";
import Toast from "../ui/Toast";

export function SiteLayout() {
  const location = useLocation();
  const [toast, setToast] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [searchedAwbs, setSearchedAwbs] = useState([]);
  const showToast = (message, tone = "success") =>
    setToast({ id: Date.now(), message, tone });
  const mode = location.pathname.startsWith("/tracking/")
    ? "detail"
    : location.pathname === "/results"
      ? "results"
      : "home";
  const pageTitle =
    location.pathname === "/admin"
      ? "Kelola Data | Anteraja Frozen Day 13"
      : mode === "detail"
      ? "Detail Pengiriman | Anteraja Frozen"
      : mode === "results"
        ? "Status Pengiriman | Anteraja Frozen"
        : "Lacak Paket | Anteraja Frozen";
  useEffect(() => {
    if (location.pathname === "/results" && location.search) {
      const frame = window.requestAnimationFrame(() => {
        document.getElementById("hasil")?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
          block: "start",
        });
      });
      return () => window.cancelAnimationFrame(frame);
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-ink-950 focus:px-4 focus:py-2 text-white"
      >
        Lewati ke konten utama
      </a>
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-4 py-8 md:px-8"
      >
        <Outlet context={{ now, showToast, searchedAwbs, setSearchedAwbs }} />
        <section
          id="customer-care"
          className="mt-10 scroll-mt-24 rounded-card-lg border border-brand-100 bg-brand-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-5"
          aria-labelledby="customer-care-title"
        >
          <div>
            <h2 id="customer-care-title" className="font-extrabold">
              Butuh bantuan terkait kiriman Anda?
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              Hubungi Customer Care Anteraja melalui saluran resmi.
            </p>
          </div>
          <a
            href="tel:+622150663333"
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-700 sm:mt-0"
          >
            (021) 5066 3333
          </a>
        </section>
      </main>
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      )}
      <SiteFooter />
    </>
  );
}
