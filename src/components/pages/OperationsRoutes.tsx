import { Routes, Route } from "react-router-dom";
import RequirePermission from "../auth/RequirePermission";
import OperationsPage from "../../pages/operations/OperationsPage";
import OperationsLayout from "../sidebar/OperationsLayout";
import MapsRoutes from "./operateions/maps/MapsRoutes";
import ContractsRoutes from "./operateions/contracts/ContractsRoutes";
import BOQRoutes from "./operateions/BOQ/BOQRoutes";
import OperationsSettingsRoutes from "./operateions/settings/OperationsSettingsRoutes";

// view_operations_maps/_contracts/_boq are project-scoped, so they can
// only be asked on a route carrying :projectId — that guard now lives
// inside MapsRoutes.tsx/ContractsRoutes.tsx/BOQRoutes.tsx, on the
// project/:projectId branch specifically, not here. Each section's index
// is a project picker with nothing project-specific to check, so it's
// reachable to anyone who reached /operations at all (view_operations_section,
// the outer App.tsx guard). view_operations_settings stays company-wide,
// so it's still gated at this level like before.
export default function OperationsRoutes() {
  return (
    <Routes>
      <Route element={<OperationsLayout />}>
        <Route index element={<OperationsPage />} />

        <Route path="maps/*" element={<MapsRoutes />} />
        <Route path="contracts/*" element={<ContractsRoutes />} />
        <Route path="boq/*" element={<BOQRoutes />} />

        <Route
          element={<RequirePermission permission="view_operations_settings" />}
        >
          <Route path="settings/*" element={<OperationsSettingsRoutes />} />
        </Route>
      </Route>
    </Routes>
  );
}
