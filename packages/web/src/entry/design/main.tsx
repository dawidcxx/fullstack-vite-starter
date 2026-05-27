import "@/global.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Router, useLocation } from "wouter";

type TabKey = "components" | "compositions";

const tabContent: Record<TabKey, string> = {
  components: "Placeholder content...",
  compositions: "Placeholder content...",
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router base="/design">
      <App />
    </Router>
  </StrictMode>,
);

function App() {
  const [location, navigate] = useLocation();
  const activeTab: TabKey = location.startsWith("/compositions") ? "compositions" : "components";

  const activeButtonClass = "bg-black text-white";
  const inactiveButtonClass = "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50";

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl p-6">
      <h1 className="mb-6 text-3xl font-bold">UI Sandbox</h1>

      <div className="mb-4 flex gap-2" role="tablist" aria-label="Design tabs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "components"}
          onClick={() => navigate("/components")}
          className={`rounded px-4 py-2 text-sm font-medium ${
            activeTab === "components" ? activeButtonClass : inactiveButtonClass
          }`}
        >
          Components
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "compositions"}
          onClick={() => navigate("/compositions")}
          className={`rounded px-4 py-2 text-sm font-medium ${
            activeTab === "compositions" ? activeButtonClass : inactiveButtonClass
          }`}
        >
          Compositions
        </button>
      </div>

      <div
        className="rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700"
        role="tabpanel"
      >
        {tabContent[activeTab]}
      </div>
    </div>
  );
}