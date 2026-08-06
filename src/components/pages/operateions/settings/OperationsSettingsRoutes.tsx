import { Routes, Route } from "react-router-dom";
import OperationsSettingsPage from "../../../../pages/operations/settings/OperationsSettingsPage";
import TemplateTypesPage from "../../../../pages/operations/settings/boq/TemplateTypesPage";
import TemplateTypeDetailPage from "../../../../pages/operations/settings/boq/TemplateTypeDetailPage";

export default function OperationsSettingsRoutes() {
  return (
    <Routes>
      <Route index element={<OperationsSettingsPage />} />
      <Route path="boq/templates" element={<TemplateTypesPage />} />
      <Route
        path="boq/templates/:templateTypeId"
        element={<TemplateTypeDetailPage />}
      />
    </Routes>
  );
}
