import { createContext, useContext, useState } from "react";
import { useProvinces, useRegencies } from "../hooks/useLocationData";
import { usePackageImages } from "../hooks/usePackageImages";

const ShipmentContext = createContext(null);
const emptyLocation = { provinceId: "", regencyId: "" };

export function ShipmentProvider({ children }) {
  const [origin, setOrigin] = useState(emptyLocation);
  const [destination, setDestination] = useState(emptyLocation);
  const provinces = useProvinces();
  const originRegencies = useRegencies(origin.provinceId);
  const destinationRegencies = useRegencies(destination.provinceId);
  const originData = { ...provinces, ...originRegencies };
  const destinationData = { ...provinces, ...destinationRegencies };
  const imageData = usePackageImages();

  const changeProvince = (side, provinceId) => {
    const update = side === "origin" ? setOrigin : setDestination;
    update({ provinceId, regencyId: "" });
  };
  const changeRegency = (side, regencyId) => {
    const update = side === "origin" ? setOrigin : setDestination;
    update((current) => ({ ...current, regencyId }));
  };

  return (
    <ShipmentContext.Provider value={{
      origin, destination, originData, destinationData, imageData,
      changeProvince, changeRegency,
    }}>
      {children}
    </ShipmentContext.Provider>
  );
}

export function useShipmentContext() {
  const context = useContext(ShipmentContext);
  if (!context) throw new Error("useShipmentContext harus dipakai di dalam ShipmentProvider");
  return context;
}
