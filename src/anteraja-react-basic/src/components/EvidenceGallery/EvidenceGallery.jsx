import { useRef, useState } from "react";
import { formatDateTime } from "../../utils/format";
import Panel from "../ui/Panel";

function EvidenceCard({ title, evidence, onOpen }) {
  if (!evidence)
    return (
      <article className="rounded-card border border-dashed border-ink-300 bg-ink-50 p-4">
        <span className="text-xs font-extrabold text-ink-500">MENUNGGU</span>
        <h3 className="mt-2 font-bold">{title}</h3>
        <p className="mt-1 text-sm text-ink-600">
          Akan tersedia setelah kejadian pengiriman tercatat.
        </p>
      </article>
    );
  return (
    <article className="overflow-hidden rounded-card border border-ink-200">
      <div className="flex flex-wrap justify-between gap-2 p-4 text-xs">
        <strong className="text-success-700">Tercatat</strong>
        <time dateTime={evidence.occurredAt} className="text-ink-500">
          {formatDateTime(evidence.occurredAt)}
        </time>
      </div>
      {evidence.imageUrl ? (
        <button
          type="button"
          onClick={() =>
            onOpen(
              evidence.imageUrl,
              `${title} · ${formatDateTime(evidence.occurredAt)}`,
            )
          }
          className="block w-full overflow-hidden bg-ink-100 text-left"
          aria-label={`Perbesar ${title.toLowerCase()}`}
        >
          <img
            src={evidence.imageUrl}
            alt={`${title} paket`}
            width="1280"
            height="720"
            loading="lazy"
            className="aspect-video w-full object-cover transition-transform hover:scale-[1.02]"
          />
        </button>
      ) : (
        <div className="grid aspect-video place-items-center bg-ink-100 text-sm text-ink-500">
          Foto belum tersedia
        </div>
      )}
      <div className="p-4">
        <h3 className="font-extrabold">{title}</h3>
        <p className="mt-1 text-xs text-ink-500">{evidence.location}</p>
        <dl className="mt-4 grid gap-3 text-sm">
          <div>
            <dt className="text-ink-500">Kurir</dt>
            <dd className="font-semibold">{evidence.courier}</dd>
          </div>
          <div>
            <dt className="text-ink-500">
              {title === "Foto pickup" ? "Diserahkan oleh" : "Diterima oleh"}
            </dt>
            <dd className="font-semibold">{evidence.party}</dd>
          </div>
          <div>
            <dt className="text-ink-500">Keterangan</dt>
            <dd>{evidence.note}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export function EvidenceGallery({ awb, pickup, delivery }) {
  const dialogRef = useRef(null);
  const [preview, setPreview] = useState({ url: "", caption: "" });
  const openPreview = (url, caption) => {
    setPreview({ url, caption });
    dialogRef.current?.showModal();
  };
  const available = [pickup?.imageUrl, delivery?.imageUrl].filter(
    Boolean,
  ).length;
  return (
    <Panel aria-labelledby="evidence-title" id="delivery-evidence">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-ink-200 pb-4">
        <div>
          <p className="text-xs font-extrabold tracking-wider text-brand-700 uppercase">
            Dokumentasi perjalanan
          </p>
          <h2 id="evidence-title" className="mt-1 text-lg font-extrabold">
            Foto pickup dan penerimaan
          </h2>
        </div>
        <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-bold text-ink-600">
          {available}/2 foto tersedia
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <EvidenceCard
          title="Foto pickup"
          evidence={pickup}
          onOpen={openPreview}
        />
        <EvidenceCard
          title="Foto penerimaan"
          evidence={delivery}
          onOpen={openPreview}
        />
      </div>
      <dialog
        ref={dialogRef}
        aria-label={`Foto dokumentasi ${awb}`}
        className="m-auto max-h-[90vh] w-[min(95vw,60rem)] rounded-card-lg border border-ink-200 bg-white p-4 shadow-card-raised backdrop:bg-ink-950/75"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current.close();
        }}
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold">{preview.caption}</p>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="grid size-9 place-items-center rounded-full bg-ink-100 text-lg"
            aria-label="Tutup foto"
          >
            ×
          </button>
        </div>
        {preview.url && (
          <img
            src={preview.url}
            alt={preview.caption}
            className="max-h-[75vh] w-full rounded-card object-contain"
          />
        )}
      </dialog>
    </Panel>
  );
}
