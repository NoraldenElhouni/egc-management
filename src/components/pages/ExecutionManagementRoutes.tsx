import { Route, Routes } from "react-router-dom";
import ExecutionManagementPage from "../../pages/execution-management/ExecutionManagementPage";
import ExecutionManagementLayout from "../sidebar/ExecutionManagementLayout";
import ExecutionManagementProjectPage from "../../pages/execution-management/projects/ExecutionManagementProjectPage";

const ExecutionManagementRoutes = () => {
  return (
    <Routes>
      <Route element={<ExecutionManagementLayout />}>
        <Route index element={<ExecutionManagementPage />} />
        <Route path="/projects" element={<ExecutionManagementProjectPage />} />
      </Route>
    </Routes>
  );
};

export default ExecutionManagementRoutes;
