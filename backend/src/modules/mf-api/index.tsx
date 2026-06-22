import type { ReactNode } from "react";
import { FiDatabase } from "react-icons/fi";
import { Navigate, Route } from "react-router-dom";

import MfApiDashboardPage from "./pages/MfApiDashboardPage";
import MfApiImportExportPage from "./pages/MfApiImportExportPage";
import MfApiSchemeDetailPage from "./pages/MfApiSchemeDetailPage";
import MfApiSchemeListingPage from "./pages/MfApiSchemeListingPage";
import MfApiSyncLogsPage from "./pages/MfApiSyncLogsPage";

type MfApiNavItem = {
  name: string;
  icon: ReactNode;
  roles?: string[];
  subItems: {
    name: string;
    path: string;
    roles?: string[];
  }[];
};

export const getMfApiNavItem = (role: string): MfApiNavItem => ({
  name: "MF API (Automation)",
  icon: <FiDatabase />,
  roles: ["admin", "editor"],
  subItems: [
    {
      name: "Dashboard",
      path: `/${role}/mf-api/dashboard`,
      roles: ["admin", "editor"],
    },
    {
      name: "Scheme Master",
      path: `/${role}/mf-api/schemes`,
      roles: ["admin", "editor"],
    },
    {
      name: "Sync Logs",
      path: `/${role}/mf-api/sync-logs`,
      roles: ["admin", "editor"],
    },
    {
      name: "Import / Export",
      path: `/${role}/mf-api/import-export`,
      roles: ["admin", "editor"],
    },
  ],
});

export const renderMfApiRoutes = (role: string) => {
  const currentRole = role || "admin";

  return (
    <>
      <Route
        path="/:role/mf-api"
        element={<Navigate to={`/${currentRole}/mf-api/dashboard`} replace />}
      />
      <Route path="/:role/mf-api/dashboard" element={<MfApiDashboardPage />} />
      <Route
        path="/:role/mf-api/schemes"
        element={<MfApiSchemeListingPage />}
      />
      <Route
        path="/:role/mf-api/schemes/:id"
        element={<MfApiSchemeDetailPage />}
      />
      <Route path="/:role/mf-api/sync-logs" element={<MfApiSyncLogsPage />} />
      <Route
        path="/:role/mf-api/import-export"
        element={<MfApiImportExportPage />}
      />
    </>
  );
};
