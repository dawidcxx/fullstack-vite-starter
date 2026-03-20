import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

function App() {
  return (
    <div className="flex h-screen items-center justify-center">
      <h1 className="text-4xl font-bold text-gray-800">Hello, Vite + React + Tailwind CSS!</h1>
    </div>
  );
}
