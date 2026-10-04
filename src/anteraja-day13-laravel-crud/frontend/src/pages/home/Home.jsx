import { useNavigate, useOutletContext } from "react-router-dom";
import SearchHero from "../../components/SearchHero";
import Button from "../../components/ui/Button";

const serviceFeatures = [
  {
    title: "Status perjalanan",
    image: "/images/hub.png",
    description: "Lihat kejadian terbaru dan linimasa perpindahan paket.",
  },
  {
    title: "Detail pengiriman",
    image: "/images/map.png",
    description:
      "Lihat pengirim, penerima, kurir, dan status paket yang tercatat.",
  },
  {
    title: "Suhu kompartemen",
    image: "/images/snowflake.png",
    description: "Pantau pembacaan suhu lingkungan aset dan riwayatnya.",
  },
];

export function Home() {
  const navigate = useNavigate();
  const { showToast, setSearchedAwbs } = useOutletContext();
  return (
    <>
      <SearchHero
        awbs={[]}
        onSearch={(awbs) => {
          setSearchedAwbs(awbs);
          navigate("/results");
        }}
        onNotify={showToast}
      />
      <section
        aria-labelledby="service-title"
        className="mx-auto mt-8 max-w-5xl border-t border-ink-200 pt-10"
      >
        <div className="text-center">
          <h2 id="service-title" className="text-2xl font-extrabold">
            Informasi yang dapat Anda lihat
          </h2>
          <p className="mt-2 text-sm text-ink-600">
            Seluruh informasi pengiriman tampil setelah nomor resi ditemukan.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {serviceFeatures.map((feature) => (
            <article
              key={feature.title}
              className="rounded-card border border-ink-200 bg-white p-5"
            >
              <img
                src={feature.image}
                alt=""
                aria-hidden="true"
                width="40"
                height="40"
                className="h-10 w-10 object-contain"
              />
              <h3 className="mt-3 font-extrabold">{feature.title}</h3>
              <p className="mt-1 text-sm text-ink-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>
      <div className="mx-auto mt-8 max-w-3xl text-center text-xs text-ink-500">
        <p>
          Suhu yang ditampilkan merupakan suhu lingkungan kompartemen atau
          armada.
        </p>
        <Button
          variant="ghost"
          className="mt-2"
          onClick={() => document.getElementById("beranda")?.scrollIntoView()}
        >
          Kembali ke pencarian ↑
        </Button>
      </div>
    </>
  );
}
