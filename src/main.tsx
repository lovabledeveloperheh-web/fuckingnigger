import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import "./index.css";
import { setupCapacitorAuthListener } from "./lib/capacitor-auth";

// Add capacitor-app class for native-specific styling
if (Capacitor.isNativePlatform()) {
  document.body.classList.add("capacitor-app");
  // Set up deep link listener for auth callbacks
  setupCapacitorAuthListener();
}

createRoot(document.getElementById("root")!).render(<App />);
