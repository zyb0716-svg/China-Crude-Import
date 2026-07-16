import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { CrudeImportDashboard } from "../app/CrudeImportDashboard";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CrudeImportDashboard />
  </StrictMode>,
);
