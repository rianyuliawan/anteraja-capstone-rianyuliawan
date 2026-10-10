import { useRef, useState } from "react";
import { FiDownload, FiLoader, FiMaximize2, FiX } from "react-icons/fi";
import { formatDateTime } from "../../utils/format";
import Panel from "../ui/Panel";

function wrapText(context, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && context.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Foto tidak dapat dibaca."));
    };
    image.src = url;
  });
}

async function downloadEvidence(awb, type, evidence) {
  const response = await fetch(evidence.imageUrl);
  if (!response.ok) throw new Error("Foto belum dapat diunduh.");

  const image = await loadImage(await response.blob());
  const canvas = document.createElement("canvas");
  const width = Math.min(image.naturalWidth, 1600);
  const photoHeight = Math.round(
    (image.naturalHeight * width) / image.naturalWidth,
  );
  const padding = Math.max(20, Math.round(width * 0.035));
  const fontSize = Math.max(15, Math.round(width * 0.019));
  const lineHeight = Math.round(fontSize * 1.5);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Perangkat tidak dapat menyiapkan foto.");

  context.font = `${fontSize}px sans-serif`;
  const details = [
    `Waktu kejadian: ${evidence.occurredAt ? formatDateTime(evidence.occurredAt) : "Belum tercatat"}`,
    `Kurir: ${evidence.courier || "Belum tercatat"}`,
    `${type === "pickup" ? "Diserahkan oleh" : "Diterima oleh"}: ${evidence.party || "Belum tercatat"}`,
    `Lokasi: ${evidence.location || "Belum tercatat"}`,
    ...(evidence.note ? [`Keterangan: ${evidence.note}`] : []),
  ];
  const lines = details.flatMap((detail) =>
    wrapText(context, detail, width - padding * 2),
  );
  const footerHeight = padding * 3 + lineHeight * (lines.length + 2);
  canvas.width = width;
  canvas.height = photoHeight + footerHeight;
  const colors = getComputedStyle(document.documentElement);

  context.drawImage(image, 0, 0, width, photoHeight);
  context.fillStyle = colors.getPropertyValue("--color-ink-950").trim();
  context.fillRect(0, photoHeight, width, footerHeight);
  context.fillStyle = colors.getPropertyValue("--color-white").trim();
  context.font = `bold ${Math.round(fontSize * 1.15)}px sans-serif`;
  context.fillText(
    `${type === "pickup" ? "FOTO PICKUP" : "FOTO PENERIMAAN"} · ${awb}`,
    padding,
    photoHeight + padding + lineHeight,
    width - padding * 2,
  );
  context.font = `${fontSize}px sans-serif`;
  lines.forEach((line, index) => {
    context.fillText(
      line,
      padding,
      photoHeight + padding + lineHeight * (index + 2),
      width - padding * 2,
    );
  });
  context.fillStyle = colors.getPropertyValue("--color-ink-300").trim();
  context.fillText(
    "Gambar representatif · Keterangan pengiriman dari sistem",
    padding,
    canvas.height - padding,
    width - padding * 2,
  );

  const output = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!output) throw new Error("Foto belum dapat disimpan.");
  const url = URL.createObjectURL(output);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${awb.replace(/[^a-zA-Z0-9-]/g, "")}-${type}-berlabel.png`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function EvidenceDetails({ evidence, type }) {
  const fields = [
    [
      "Waktu kejadian",
      evidence.occurredAt
        ? formatDateTime(evidence.occurredAt)
        : "Belum tercatat",
    ],
    ["Kurir", evidence.courier || "Belum tercatat"],
    [
      type === "pickup" ? "Diserahkan oleh" : "Diterima oleh",
      evidence.party || "Belum tercatat",
    ],
    ["Lokasi", evidence.location || "Belum tercatat"],
    ["Keterangan", evidence.note],
  ].filter(([, value]) => value);

  return (
    <dl className="grid gap-3 text-sm">
      {fields.map(([label, value]) => (
        <div
          key={label}
          className="grid gap-1 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-3"
        >
          <dt className="text-ink-500">{label}</dt>
          <dd className="min-w-0 break-words font-semibold">
            {label === "Waktu kejadian" && evidence.occurredAt ? (
              <time dateTime={evidence.occurredAt}>{value}</time>
            ) : (
              value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function EvidenceCard({ awb, type, evidence, onOpen }) {
  const title = type === "pickup" ? "Foto pickup" : "Foto penerimaan";
  if (!evidence)
    return (
      <article className="rounded-card border border-dashed border-ink-300 bg-ink-50 p-5">
        <span className="text-xs font-extrabold tracking-wide text-ink-500 uppercase">
          Belum tercatat
        </span>
        <h3 className="mt-2 font-extrabold">{title}</h3>
        <p className="mt-1 text-sm text-ink-600">
          Dokumentasi akan tersedia setelah kejadian pengiriman tercatat.
        </p>
      </article>
    );

  return (
    <article className="min-w-0 overflow-hidden rounded-card border border-ink-200 bg-white shadow-card">
      {evidence.imageUrl ? (
        <button
          type="button"
          onClick={() => onOpen(type, evidence)}
          className="relative block w-full overflow-hidden bg-ink-100 text-left hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          aria-label={`Perbesar ${title.toLowerCase()} ${awb}`}
        >
          <img
            src={evidence.imageUrl}
            alt={`Gambar representatif ${title.toLowerCase()} paket ${awb}`}
            width="1280"
            height="720"
            loading="lazy"
            className="aspect-video w-full object-cover"
          />
          <span
            className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-white/95 text-ink-950 shadow-card"
            aria-hidden="true"
          >
            <FiMaximize2 className="size-4" />
          </span>
        </button>
      ) : (
        <div className="grid aspect-video place-items-center bg-ink-100 p-4 text-center text-sm text-ink-500">
          Kejadian sudah tercatat, tetapi foto belum tersedia.
        </div>
      )}
      <div className="p-4">
        <h3 className="font-extrabold">{title}</h3>
      </div>
    </article>
  );
}

export function EvidenceGallery({ awb, pickup, delivery }) {
  const dialogRef = useRef(null);
  const [showPhotos, setShowPhotos] = useState(false);
  const [preview, setPreview] = useState(null);
  const [downloading, setDownloading] = useState("");
  const [downloadMessage, setDownloadMessage] = useState("");

  const openPreview = (type, evidence) => {
    setPreview({ type, evidence });
    setDownloadMessage("");
    dialogRef.current?.showModal();
  };
  const handleDownload = async (type, evidence) => {
    if (downloading) return;
    setDownloading(type);
    try {
      await downloadEvidence(awb, type, evidence);
      setDownloadMessage("Foto dengan keterangan berhasil diunduh.");
    } catch {
      setDownloadMessage("Foto belum dapat diunduh. Silakan coba lagi.");
    } finally {
      setDownloading("");
    }
  };

  return (
    <Panel aria-labelledby="evidence-title" id="delivery-evidence">
      <div className="mb-4 border-b border-ink-200 pb-4 sm:mb-5">
        <h2 id="evidence-title" className="text-lg font-extrabold">
          Dokumentasi perjalanan
        </h2>
      </div>
      <button
        type="button"
        className="min-h-11 w-full rounded-card border border-ink-200 px-4 text-left text-sm font-bold text-brand-700 hover:bg-brand-50 sm:hidden"
        aria-expanded={showPhotos}
        aria-controls="evidence-photos"
        onClick={() => setShowPhotos((current) => !current)}
      >
        {showPhotos ? "Sembunyikan foto" : "Lihat foto pickup dan penerimaan"}
      </button>
      <div
        id="evidence-photos"
        className={`grid gap-4 2xl:grid-cols-2 ${showPhotos ? "mt-4 sm:mt-0" : "max-sm:hidden"}`}
      >
        <EvidenceCard
          awb={awb}
          type="pickup"
          evidence={pickup}
          onOpen={openPreview}
        />
        <EvidenceCard
          awb={awb}
          type="delivery"
          evidence={delivery}
          onOpen={openPreview}
        />
      </div>
      <dialog
        ref={dialogRef}
        aria-label={`Foto dokumentasi ${awb}`}
        className="m-auto max-h-[90dvh] w-[min(95vw,60rem)] overflow-y-auto rounded-card-lg border border-ink-200 bg-white p-4 shadow-card-raised backdrop:bg-ink-950/75 sm:p-6"
        onClose={() => setPreview(null)}
      >
        {preview && (
          <>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold tracking-wide text-brand-700 uppercase">
                  Dokumentasi{" "}
                  {preview.type === "pickup" ? "pickup" : "penerimaan"}
                </p>
                <h3 className="text-lg font-extrabold">{awb}</h3>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(preview.type, preview.evidence)}
                  disabled={Boolean(downloading)}
                  className="grid size-10 place-items-center rounded-full bg-brand-500 p-0 leading-none text-white hover:bg-brand-700 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                  aria-label={
                    downloading
                      ? "Menyiapkan foto"
                      : "Unduh foto dengan keterangan"
                  }
                  title="Unduh foto"
                >
                  {downloading ? (
                    <FiLoader
                      aria-hidden="true"
                      className="size-5 animate-spin"
                    />
                  ) : (
                    <FiDownload aria-hidden="true" className="size-5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="grid size-10 place-items-center rounded-full bg-ink-100 p-0 leading-none hover:bg-ink-200 focus-visible:outline-2 focus-visible:outline-brand-500"
                  aria-label="Tutup foto"
                >
                  <FiX aria-hidden="true" className="size-5" />
                </button>
              </div>
            </div>
            <img
              src={preview.evidence.imageUrl}
              alt={`Gambar representatif ${preview.type === "pickup" ? "pickup" : "penerimaan"} paket ${awb}`}
              className="max-h-[55dvh] w-full rounded-card bg-ink-100 object-contain"
            />
            <div className="mt-4 rounded-card bg-ink-50 p-4">
              <EvidenceDetails
                evidence={preview.evidence}
                type={preview.type}
              />
            </div>
            {downloadMessage && (
              <p
                role="status"
                className="mt-2 text-sm font-semibold text-brand-700"
              >
                {downloadMessage}
              </p>
            )}
          </>
        )}
      </dialog>
    </Panel>
  );
}
