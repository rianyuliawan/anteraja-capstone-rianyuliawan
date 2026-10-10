import { FiX } from "react-icons/fi";

const styles = {
  success: {
    title: "Berhasil",
    icon: "✓",
    badge: "bg-success-100 text-success-700",
    bar: "bg-success-700",
  },
  info: {
    title: "Daftar diperbarui",
    icon: "i",
    badge: "bg-cold-100 text-cold-700",
    bar: "bg-cold-700",
  },
  error: {
    title: "Perlu perhatian",
    icon: "!",
    badge: "bg-danger-100 text-danger-700",
    bar: "bg-danger-700",
  },
};

export function Toast({ message, tone = "success", onClose }) {
  const style = styles[tone] || styles.success;

  return (
    <div className="fixed right-4 bottom-4 left-4 z-50 sm:right-6 sm:bottom-6 sm:left-auto sm:w-88">
      <div
        role={tone === "error" ? "alert" : "status"}
        aria-live={tone === "error" ? "assertive" : "polite"}
        className="toast-enter overflow-hidden rounded-card-lg border border-ink-200 bg-white shadow-card-raised"
      >
        <div className="flex items-start gap-3 p-4">
          <span
            aria-hidden="true"
            className={`grid size-10 shrink-0 place-items-center rounded-full text-lg font-extrabold ${style.badge}`}
          >
            {style.icon}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-extrabold text-ink-950">{style.title}</p>
            <p className="mt-0.5 text-sm leading-snug text-ink-600">{message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup notifikasi"
            className="grid size-9 shrink-0 place-items-center rounded-full p-0 leading-none text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-950 focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            <FiX aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div className="h-1 bg-ink-100" aria-hidden="true">
          <div className={`toast-progress h-full ${style.bar}`} />
        </div>
      </div>
    </div>
  );
}
