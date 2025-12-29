import { Routes, Route } from "react-router-dom";
import SettingsLayout from "../sidebar/SettingsLayout";
import SettingsPage from "../../pages/settings/SettingsPage";
import SettingsRolesPage from "../../pages/settings/roles/SettingsRolesPage";
import NewRolePage from "../../pages/settings/roles/NewRolePage";
import RolesDetailsPage from "../../pages/settings/roles/RolesDetailsPage";
import SettingsExpensesPage from "../../pages/settings/expenses/SettingsExpensesPage";
import SettingsSpecializationsPage from "../../pages/settings/specializations/SettingsSpecializationsPage";
import SpecializationsDetailsPage from "../../pages/settings/specializations/id/SpecializationDetailsPage";
import MapsPage from "../../pages/settings/maps/MapsPage";

export default function SettingsRoutes() {
  return (
    <Routes>
      <Route element={<SettingsLayout />}>
        <Route index element={<SettingsPage />} />

        <Route path="roles" element={<SettingsRolesPage />} />
        <Route path="roles/new" element={<NewRolePage />} />
        <Route path="roles/:id" element={<RolesDetailsPage />} />

        <Route path="expenses" element={<SettingsExpensesPage />} />

        <Route
          path="specializations"
          element={<SettingsSpecializationsPage />}
        />
        <Route
          path="specializations/:id"
          element={<SpecializationsDetailsPage />}
        />

        <Route path="maps" element={<MapsPage />} />
      </Route>
    </Routes>
  );
}
