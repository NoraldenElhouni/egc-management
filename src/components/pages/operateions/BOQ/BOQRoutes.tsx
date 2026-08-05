import { Routes, Route } from "react-router-dom";
import OperationsBOQProjectPage from "../../../../pages/operations/BOQ/project/OperationsBOQProjectPage";
import OperationsBIQPage from "../../../../pages/operations/BOQ/OperationsBIQPage";
import BOQZonesPage from "../../../../pages/operations/BOQ/project/BOQZonesPage";
import BOQTypesPage from "../../../../pages/operations/BOQ/project/BOQTypesPage";
import BOQTypeReviewPage from "../../../../pages/operations/BOQ/project/BOQTypeReviewPage";

export default function BOQRoutes() {
  return (
    <Routes>
      <Route index element={<OperationsBIQPage />} />
      <Route
        path="project/:projectId"
        element={<OperationsBOQProjectPage />}
      />
      <Route path="project/:projectId/zones" element={<BOQZonesPage />} />
      <Route path="project/:projectId/types" element={<BOQTypesPage />} />
      <Route
        path="project/:projectId/types/:typeId"
        element={<BOQTypeReviewPage />}
      />
    </Routes>
  );
}
