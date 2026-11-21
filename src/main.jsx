import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// self-hosted fonts (no Google Fonts request)
import "@fontsource-variable/inter";
import "@fontsource-variable/source-serif-4";
import "@fontsource-variable/source-serif-4/wght-italic.css";
import "@fontsource/anton";
import "./index.css";
import { StoreProvider } from "@/lib/store";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);
