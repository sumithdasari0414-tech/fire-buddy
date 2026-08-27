import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { testFirestoreConnection } from "./integrations/firebase/incidents";

// Connection test only — logs to the console, does not affect the UI.
if (import.meta.env.DEV) void testFirestoreConnection();

createRoot(document.getElementById("root")!).render(<App />);
