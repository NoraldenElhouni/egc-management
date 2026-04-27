import { Routes, Route } from "react-router-dom";
import OperationsPage from "../../pages/operations/OperationsPage";
import OperationsMapsPage from "../../pages/operations/mpas/OperationsMapsPage";
import OperationsMapsProjectPage from "../../pages/operations/mpas/project/OperationsMapsProjectPage";

export default function OperationsRoutes() {
  return (
    <Routes>
      <Route>
        <Route index element={<OperationsPage />} />

        {/* ✅ ADD THESE*/}
        {/* <Route path="manage" element={<OperationsManagePage />} /> */}
        <Route path="maps" element={<OperationsMapsPage />} />
        <Route
          path="maps/project/:id"
          element={<OperationsMapsProjectPage />}
        />
      </Route>
    </Routes>
  );
}
