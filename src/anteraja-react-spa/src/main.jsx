import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import SiteLayout from "./components/SiteLayout";
import Home from "./pages/home";
import Results from "./pages/results";
import Tracking from "./pages/tracking";
import NotFound from "./pages/notFound";
import { ShipmentProvider } from "./context/ShipmentContext";
import "./index.css";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ShipmentProvider>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<Home />} />
            <Route path="shipments" element={<Results />} />
            <Route path="shipments/:id" element={<Tracking />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ShipmentProvider>
    </BrowserRouter>
  </StrictMode>,
);
