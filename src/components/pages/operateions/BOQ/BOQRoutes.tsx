import { Routes, Route } from "react-router-dom";
import OperationsMapsProjectPage from "../../../../pages/operations/mpas/project/OperationsMapsProjectPage";
import OperationsBIQPage from "../../../../pages/operations/BOQ/OperationsBIQPage";

export default function BOQRoutes() {
  return (
    <Routes>
      <Route index element={<OperationsBIQPage />} />
      <Route
        path="project/:projectId"
        element={<OperationsMapsProjectPage />}
      />
    </Routes>
  );
}
