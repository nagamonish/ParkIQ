import { useState } from "react";

import { Sidebar } from "./components/Sidebar.jsx";
import { Topbar } from "./components/Topbar.jsx";
import { Icon } from "./components/Icon.jsx";
import { useHashRoute } from "./router.js";
import { useOperator } from "./hooks/useOperator.js";
import { isAuthed, signOut } from "./auth.js";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import CamerasPage from "./pages/CamerasPage.jsx";
import SpacesPage from "./pages/SpacesPage.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

const PAGES = {
  dashboard: DashboardPage,
  cameras: CamerasPage,
  spaces: SpacesPage,
  analytics: AnalyticsPage,
  settings: SettingsPage,
};

export default function App() {
  const [authed, setAuthed] = useState(isAuthed());
  const route = useHashRoute();
  const op = useOperator();
  const Page = PAGES[route] || DashboardPage;

  if (!authed) {
    return <LoginPage onAuth={() => setAuthed(true)} />;
  }

  const onLogout = () => {
    signOut();
    setAuthed(false);
  };

  return (
    <div className="shell">
      <Sidebar route={route} summary={op.summary} onLogout={onLogout} />
      <div className="shell-main">
        <Topbar route={route} op={op} />
        <main className="page">
          {!op.reachable && (
            <div className="banner banner--error">
              <Icon name="alert" size={18} />
              <span>
                Can't reach the ParkIQ backend. Start it with{" "}
                <code>uvicorn backend.api.main:app --port 8000</code> — it'll connect automatically.
              </span>
            </div>
          )}
          <Page op={op} />
        </main>
      </div>
    </div>
  );
}
