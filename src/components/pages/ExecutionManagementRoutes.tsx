import { Route, Routes } from "react-router-dom";
import RequirePermission from "../auth/RequirePermission";
import ExecutionManagementPage from "../../pages/execution-management/ExecutionManagementPage";
import ExecutionManagementLayout from "../sidebar/ExecutionManagementLayout";
import ExecutionManagementProjectPage from "../../pages/execution-management/projects/ExecutionManagementProjectPage";

const ExecutionManagementRoutes = () => {
  return (
    <Routes>
      <Route element={<RequirePermission permission="manage_execution" />}>
        <Route element={<ExecutionManagementLayout />}>
          <Route index element={<ExecutionManagementPage />} />
          <Route
            path="/projects"
            element={<ExecutionManagementProjectPage />}
          />
        </Route>
      </Route>
    </Routes>
  );
};

export default ExecutionManagementRoutes;
