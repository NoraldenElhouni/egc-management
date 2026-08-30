import { Routes, Route } from "react-router-dom";
import SettingsLayout from "../sidebar/SettingsLayout";
import SettingsPage from "../../pages/settings/SettingsPage";
import SettingsRolesPage from "../../pages/settings/roles/SettingsRolesPage";
import NewRolePage from "../../pages/settings/roles/NewRolePage";
import RolesDetailsPage from "../../pages/settings/roles/RolesDetailsPage";
import SettingsExpensesPage from "../../pages/settings/expenses/SettingsExpensesPage";
import SettingsSpecializationsPage from "../../pages/settings/specializations/SettingsSpecializationsPage";
import SpecializationDetailPage from "../../pages/settings/specializations/SpecializationDetailPage";
import MapsPage from "../../pages/settings/maps/MapsPage";
import ExpenseDetailsPage from "../../pages/settings/expenses/ExpenseDetailsPage";
import BanksPage from "../../pages/settings/banks/BanksPage";
import UserSessionsPage from "../../pages/settings/sessions/UserSessionsPage";
import LogsPage from "../../pages/settings/logs/LogsPage";
import UserPasswordResetPage from "../../pages/settings/passwordReset/UserPasswordResetPage";
import WebsitePage from "../../pages/settings/website/WebsitePage";
import WebsiteCategoriesPage from "../../pages/settings/website/WebsiteCategoriesPage";
import WebsiteHeroSlidesPage from "../../pages/settings/website/WebsiteHeroSlidesPage";
import WebsiteProjectsPage from "../../pages/settings/website/WebsiteProjectsPage";
import WebsiteNewProjectPage from "../../pages/settings/website/WebsiteNewProjectPage";
import WebsiteProjectDetailsPage from "../../pages/settings/website/WebsiteProjectDetailsPage";
import WebsiteEditProjectPage from "../../pages/settings/website/WebsiteEditProjectPage";
import WebsiteTeamPage from "../../pages/settings/website/WebsiteTeamPage";

export default function SettingsRoutes() {
  return (
    <Routes>
      <Route element={<SettingsLayout />}>
        <Route index element={<SettingsPage />} />

        <Route path="roles" element={<SettingsRolesPage />} />
        <Route path="roles/new" element={<NewRolePage />} />
        <Route path="roles/:id" element={<RolesDetailsPage />} />

        <Route path="expenses" element={<SettingsExpensesPage />} />
        <Route path="expenses/:id" element={<ExpenseDetailsPage />} />

        <Route
          path="specializations"
          element={<SettingsSpecializationsPage />}
        />
        <Route
          path="specializations/:id"
          element={<SpecializationDetailPage />}
        />

        <Route path="maps" element={<MapsPage />} />
        <Route path="banks" element={<BanksPage />} />
        <Route path="sessions" element={<UserSessionsPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="password-reset" element={<UserPasswordResetPage />} />
        <Route path="website" element={<WebsitePage />} />
        <Route path="website/categories" element={<WebsiteCategoriesPage />} />
        <Route
          path="website/hero-slides"
          element={<WebsiteHeroSlidesPage />}
        />
        <Route path="website/projects" element={<WebsiteProjectsPage />} />
        <Route
          path="website/projects/new"
          element={<WebsiteNewProjectPage />}
        />
        <Route
          path="website/projects/:id"
          element={<WebsiteProjectDetailsPage />}
        />
        <Route
          path="website/projects/:id/edit"
          element={<WebsiteEditProjectPage />}
        />
        <Route path="website/team" element={<WebsiteTeamPage />} />
      </Route>
    </Routes>
  );
}
