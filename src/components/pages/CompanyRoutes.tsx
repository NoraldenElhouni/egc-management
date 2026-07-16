import { Route, Routes } from "react-router-dom";
import CompanyLayout from "../sidebar/CompanyLayout";
import CompanyPage from "../../pages/company/CompanyPage";
import ProjectsDistributePage from "../../pages/company/ProjectsDistributePage";
import CompanyOverview from "../../pages/company/CompanyOverview";
import DistributionBatchesPage from "../../pages/company/DistributionBatchesPage";
import ProjectDistributionDetailPage from "../../pages/company/ProjectDistributionDetailPage";
import BatchDetailPage from "../../pages/company/DistributionBatchPage";
import SalariesPage from "../../pages/company/salary/SalariesPage";
import EmployeeDistributionDetailsPage from "../../pages/company/EmployeeDistributionDetailsPage";

const CompanyRoutes = () => {
  return (
    <Routes>
      <Route element={<CompanyLayout />}>
        <Route index element={<CompanyPage />} />
        <Route path="/salaries" element={<SalariesPage />} />
        <Route path="/salaries/:employeeId" element={<SalariesPage />} />

        <Route path="/distribute" element={<ProjectsDistributePage />} />

        <Route
          path="/distribute/batches"
          element={<DistributionBatchesPage />}
        />
        <Route path="/distribute/batch/:date" element={<BatchDetailPage />} />
        <Route
          path="/distribute/project/:projectId"
          element={<ProjectDistributionDetailPage />}
        />
        <Route
          path="/distribute/employee/:employeeId"
          element={<EmployeeDistributionDetailsPage />}
        />
        <Route path="/dashboard" element={<CompanyOverview />} />
      </Route>
    </Routes>
  );
};

export default CompanyRoutes;
