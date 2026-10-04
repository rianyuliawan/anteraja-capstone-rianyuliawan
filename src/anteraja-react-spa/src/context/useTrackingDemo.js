import { useEffect, useState } from "react";
import { currentDemoShipments } from "../data/demoShipments";
const cycles = {
  "ANT-FRZ-0002": [-5, -1.4, 1.8, -5.2],
  "ANT-FRZ-0006": [-4.7, -1.5, 1.2, -4.9],
  "ANT-FRZ-0009": [-4, -1.3, 0.8, -4.3],
};
function classify(valueC, lowC, highC) {
  if (valueC > 0) return "critical";
  if (valueC < lowC || valueC > highC) return "warning";
  return "normal";
}
export function useTrackingDemo() {
  const [shipments, setShipments] = useState(() =>
    structuredClone(currentDemoShipments),
  );
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      setShipments((current) => {
        let next = null;
        for (const [awb, shipment] of Object.entries(current)) {
          const dueAt = shipment.temperature.nextUpdateAt;
          if (
            shipment.stage === "DELIVERED" ||
            !dueAt ||
            new Date(dueAt).getTime() > tick
          )
            continue;
          const cycle = cycles[awb] ?? [shipment.temperature.valueC];
          const autoCount = shipment.history.filter((item) =>
            item.id.startsWith("auto-"),
          ).length;
          const valueC = cycle[autoCount % cycle.length];
          const observedAt = new Date(tick).toISOString();
          const nextUpdateAt = new Date(tick + 60 * 60_000).toISOString();
          const state = classify(
            valueC,
            shipment.temperature.normalLowC,
            shipment.temperature.normalHighC,
          );
          const updated = {
            ...shipment,
            temperature: {
              ...shipment.temperature,
              valueC,
              observedAt,
              nextUpdateAt,
              state,
            },
            segments: shipment.segments.map((segment) =>
              segment.state === "active" ? { ...segment, valueC } : segment,
            ),
            history: [
              {
                id: `auto-${tick}`,
                asset: shipment.temperature.asset,
                valueC,
                observedAt,
                state,
              },
              ...shipment.history,
            ],
          };
          next ??= { ...current };
          next[awb] = updated;
        }
        return next ?? current;
      });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return { shipments, now };
}
