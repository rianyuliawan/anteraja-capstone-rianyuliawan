import { createContext, useContext, useState } from "react";
import { useTrackingDemo } from "./useTrackingDemo";

const ShipmentContext = createContext(null);

export function ShipmentProvider({ children }) {
  const { shipments, now } = useTrackingDemo();
  const [searchedAwbs, setSearchedAwbs] = useState([]);

  return (
    <ShipmentContext.Provider
      value={{ shipments, now, searchedAwbs, setSearchedAwbs }}
    >
      {children}
    </ShipmentContext.Provider>
  );
}

export function useShipmentContext() {
  const context = useContext(ShipmentContext);
  if (!context) {
    throw new Error("useShipmentContext harus dipakai di dalam ShipmentProvider");
  }
  return context;
}
