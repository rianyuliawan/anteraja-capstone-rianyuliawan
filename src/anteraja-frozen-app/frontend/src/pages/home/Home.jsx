import { useNavigate, useOutletContext } from "react-router-dom";
import { FiMap, FiPackage, FiThermometer } from "react-icons/fi";
import SearchHero from "../../components/SearchHero";
import Button from "../../components/ui/Button";

const serviceFeatures = [
  {
    title: "Status perjalanan",
    icon: FiMap,
    iconClassName: "bg-brand-50 text-brand-700",
    description: "Lihat kejadian terbaru dan linimasa perpindahan paket.",
  },
  {
    title: "Detail pengiriman",
    icon: FiPackage,
    iconClassName: "bg-ink-100 text-ink-700",
    description:
      "Lihat pengirim, penerima, kurir, dan status paket yang tercatat.",
  },
  {
    title: "Suhu kompartemen",
    icon: FiThermometer,
    iconClassName: "bg-cold-100 text-cold-700",
    description: "Pantau suhu terakhir dan ringkasan pembacaan aset.",
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
          {serviceFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="rounded-card border border-ink-200 bg-white p-5"
              >
                <span
                  className={`grid size-11 place-items-center rounded-full ${feature.iconClassName}`}
                  aria-hidden="true"
                >
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-3 font-extrabold">{feature.title}</h3>
                <p className="mt-1 text-sm text-ink-600">
                  {feature.description}
                </p>
              </article>
            );
          })}
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
