import { useState } from "react";
import { formatDateTime } from "../../utils/format";
import Panel from "../ui/Panel";
import RouteMap from "../RouteMap";

export function JourneyPanel({ shipment }) {
  const [activeTab, setActiveTab] = useState("timeline");

  return (
    <Panel aria-labelledby="journey-title" id="journey">
      <div className="mb-5 flex flex-col gap-4 border-b border-ink-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="journey-title" className="text-lg font-extrabold">
            Perjalanan paket
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Pilih linimasa kejadian atau peta rute.
          </p>
        </div>
        <div
          className="grid grid-cols-2 rounded-full border border-ink-200 bg-ink-100 p-1"
          aria-label="Tampilan perjalanan paket"
        >
          {["timeline", "map"].map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`min-h-10 rounded-full px-5 text-xs font-extrabold ${activeTab === tab ? "bg-brand-500 text-white shadow-card" : "text-ink-600 hover:bg-white"}`}
            >
              {tab === "timeline" ? "Linimasa" : "Peta"}
            </button>
          ))}
        </div>
      </div>
      {activeTab === "timeline" ? (
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
      ) : (
        <RouteMap
          route={shipment.route}
          stage={shipment.stage}
          lastEventAt={shipment.lastEventAt}
        />
      )}
    </Panel>
  );
}
