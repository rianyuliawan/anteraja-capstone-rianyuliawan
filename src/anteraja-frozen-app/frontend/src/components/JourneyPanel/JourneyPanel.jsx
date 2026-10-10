import { lazy, Suspense, useId, useState } from "react";
import { formatDateTime } from "../../utils/format";
import Panel from "../ui/Panel";

const LeafletRouteMap = lazy(() => import("../LeafletRouteMap"));

export function JourneyPanel({ shipment }) {
  const [activeTab, setActiveTab] = useState("timeline");
  const id = useId();
  const tabIds = { timeline: `${id}-timeline-tab`, map: `${id}-map-tab` };
  const panelIds = { timeline: `${id}-timeline-panel`, map: `${id}-map-panel` };
  const tabs = ["timeline", "map"];
  const handleKeyDown = (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = tabs.indexOf(activeTab);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? 1
          : event.key === "ArrowRight"
            ? (current + 1) % 2
            : (current + 1) % 2;
    const nextTab = tabs[next];
    setActiveTab(nextTab);
    document.getElementById(tabIds[nextTab])?.focus();
  };
  return (
    <Panel aria-labelledby={`${id}-title`} id="journey">
      <div className="mb-5 flex flex-col gap-4 border-b border-ink-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id={`${id}-title`} className="text-lg font-extrabold">
            Perjalanan paket
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Pilih linimasa kejadian atau peta rute.
          </p>
        </div>
        <div
          className="grid grid-cols-2 rounded-full border border-ink-200 bg-ink-100 p-1"
          role="tablist"
          aria-label="Tampilan perjalanan paket"
          onKeyDown={handleKeyDown}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              id={tabIds[tab]}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={panelIds[tab]}
              tabIndex={activeTab === tab ? 0 : -1}
              onClick={() => setActiveTab(tab)}
              className={`min-h-10 rounded-full px-5 text-xs font-extrabold ${activeTab === tab ? "bg-brand-500 text-white shadow-card" : "text-ink-600 hover:bg-white"}`}
            >
              {tab === "timeline" ? "Linimasa" : "Peta"}
            </button>
          ))}
        </div>
      </div>
      <div
        id={panelIds.timeline}
        role="tabpanel"
        aria-labelledby={tabIds.timeline}
        hidden={activeTab !== "timeline"}
        tabIndex={0}
      >
        <ol className="relative ml-3 border-l-2 border-ink-200 pl-6">
          {shipment.events.map((event, index) => (
            <li key={event.id} className="relative mb-4 last:mb-0">
              <span
                className={`absolute -left-[2.15rem] grid size-7 place-items-center rounded-full border-2 border-white text-xs font-extrabold text-white ${index === 0 ? (shipment.stage === "DELIVERED" ? "bg-success-700" : "bg-brand-500") : "bg-ink-300"}`}
                aria-hidden="true"
              >
                {shipment.events.length - index}
              </span>
              <article
                className={`rounded-card border p-4 ${index === 0 ? "border-brand-100 bg-brand-50/60" : "border-ink-200 bg-white"}`}
              >
                <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs">
                  <span className="font-extrabold text-brand-700">
                    {event.status}
                  </span>
                  <time dateTime={event.occurredAt} className="text-ink-500">
                    {formatDateTime(event.occurredAt)}
                  </time>
                </div>
                <h3 className="mt-1 text-sm font-extrabold">{event.title}</h3>
                <p className="mt-1 text-sm leading-6 text-ink-600">
                  {event.description}
                </p>
              </article>
            </li>
          ))}
        </ol>
      </div>
      <div
        id={panelIds.map}
        role="tabpanel"
        aria-labelledby={tabIds.map}
        hidden={activeTab !== "map"}
        tabIndex={0}
      >
        {activeTab === "map" && shipment.route.points.length === 0 && (
          <p className="rounded-card bg-ink-50 p-5 text-sm text-ink-600">
            Titik peta belum tersedia untuk pengiriman ini.
          </p>
        )}
        {activeTab === "map" && shipment.route.points.length > 0 && (
          <Suspense
            fallback={
              <p
                role="status"
                className="rounded-card bg-ink-50 p-6 text-sm text-ink-600"
              >
                Memuat peta perjalanan…
              </p>
            }
          >
            <LeafletRouteMap
              route={shipment.route}
              segments={shipment.segments}
              stage={shipment.stage}
              lastEventAt={shipment.lastEventAt}
            />
          </Suspense>
        )}
      </div>
    </Panel>
  );
}
