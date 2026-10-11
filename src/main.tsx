import "@fontsource-variable/inter/opsz.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/app";
import { themeStore } from "@/lib/theme";

import "./styles/index.css";

themeStore.apply();

const container = document.getElementById("root");

if (container === null) {
  throw new Error("Root element #root is missing from index.html");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
