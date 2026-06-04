import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { Capacitor } from "@capacitor/core";
import { StatusBar } from "@capacitor/status-bar";

if (Capacitor.isNativePlatform()) {
  try {
    document.documentElement.classList.add("native-platform");
    StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#00000000' }).catch(() => {});
  } catch (e) {
    console.warn("StatusBar plugin error:", e);
  }
}

const router = getRouter();

// Declare sharing context types
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

const rootElement = document.getElementById("root");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}
