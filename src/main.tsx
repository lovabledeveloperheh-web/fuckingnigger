import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import "./index.css";

// Initialize Capacitor listeners after DOM is ready
const initializeApp = async () => {
  // Add capacitor-app class for native-specific styling
  if (Capacitor.isNativePlatform()) {
    document.body.classList.add("capacitor-app");
    
    // Dynamically import and set up Capacitor auth listener
    try {
      const { setupCapacitorAuthListener } = await import("./lib/capacitor-auth");
      await setupCapacitorAuthListener();
    } catch (error) {
      console.error("Error initializing Capacitor auth:", error);
    }
  }

  // Render the app
  createRoot(document.getElementById("root")!).render(<App />);
};

initializeApp();
