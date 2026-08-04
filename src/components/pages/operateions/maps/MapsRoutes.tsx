import { Routes, Route } from "react-router-dom";
import OperationsMapsPage from "../../../../pages/operations/mpas/OperationsMapsPage";
import OperationsMapsProjectPage from "../../../../pages/operations/mpas/project/OperationsMapsProjectPage";

export default function MapsRoutes() {
  return (
    <Routes>
      <Route index element={<OperationsMapsPage />} />
      <Route
        path="project/:projectId"
        element={<OperationsMapsProjectPage />}
      />
    </Routes>
  );
}
