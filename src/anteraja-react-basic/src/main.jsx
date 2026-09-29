import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import TrackingPage from "./pages/tracking";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <TrackingPage />
  </StrictMode>,
);
