import { useShipmentContext } from "../../context/ShipmentContext";
import Button from "../ui/Button";

export function PackageGallery() {
  const { imageData } = useShipmentContext();

  return (
    <section aria-labelledby="package-gallery-title" className="mt-10 border-t border-ink-200 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="package-gallery-title" className="text-xl font-extrabold">Ilustrasi penanganan paket beku</h2>
          <p className="mt-1 text-sm text-ink-600">Contoh dari Wikimedia Commons, bukan foto paket atau bukti pengiriman resi tertentu.</p>
        </div>
        <span className="text-xs font-semibold text-ink-500">Sumber: Wikimedia Commons</span>
      </div>
      {imageData.isLoading && (
        <div role="status" aria-label="Memuat ilustrasi penanganan paket beku" className="mt-5 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-48 animate-pulse rounded-card bg-ink-200 motion-reduce:animate-none" />
          ))}
        </div>
      )}
      {imageData.isError && (
        <div role="alert" className="mt-5 rounded-card border border-danger-100 bg-white p-4 text-sm">
          <p>Ilustrasi belum dapat dimuat. Pelacakan resi tetap dapat digunakan.</p>
          <Button variant="secondary" className="mt-3" onClick={imageData.retry}>Coba lagi</Button>
        </div>
      )}
      {!imageData.isLoading && !imageData.isError && imageData.images.length === 0 && (
        <p className="mt-5 text-sm text-ink-600">Belum ada ilustrasi yang tersedia.</p>
      )}
      {!imageData.isLoading && !imageData.isError && imageData.images.length > 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {imageData.images.map((image) => (
            <figure key={image.id} className="min-w-0 overflow-hidden rounded-card border border-ink-200 bg-white">
              <img
                src={image.imageUrl}
                alt={`Ilustrasi penanganan paket beku: ${image.title}`}
                loading="lazy"
                className="h-40 w-full bg-ink-100 object-cover"
              />
              <figcaption className="p-4 text-xs text-ink-600">
                <p className="line-clamp-2 font-bold text-ink-950">{image.title}</p>
                <p className="mt-1 line-clamp-2">Kredit: {image.author}</p>
                <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-brand-700 underline">
                  Sumber dan lisensi: {image.license}
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
