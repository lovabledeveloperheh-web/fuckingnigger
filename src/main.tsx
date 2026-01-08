import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import "./index.css";

// Add capacitor-app class for native-specific styling
if (Capacitor.isNativePlatform()) {
  document.body.classList.add("capacitor-app");
}

createRoot(document.getElementById("root")!).render(<App />);
