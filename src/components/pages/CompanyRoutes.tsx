import { Route, Routes } from "react-router-dom";
import RequirePermission from "../auth/RequirePermission";
import CompanyLayout from "../sidebar/CompanyLayout";
import CompanyPage from "../../pages/company/CompanyPage";
import ProjectsDistributePage from "../../pages/company/ProjectsDistributePage";
import CompanyOverview from "../../pages/company/CompanyOverview";
import DistributionBatchesPage from "../../pages/company/DistributionBatchesPage";
import ProjectDistributionDetailPage from "../../pages/company/ProjectDistributionDetailPage";
import BatchDetailPage from "../../pages/company/DistributionBatchPage";
import SalariesPage from "../../pages/company/salary/SalariesPage";
import EmployeeDistributionDetailsPage from "../../pages/company/EmployeeDistributionDetailsPage";
// Phase 5 — NEW distribution screens, on the new project_distributions
// table. Purely additive: every route above is untouched and the old
// distribute wizard at /company/distribute keeps working exactly as it
// did. Both paths exist side by side by design.
import ProjectSharesListPage from "../../pages/company/ProjectSharesListPage";
import ProjectSharesDetailPage from "../../pages/company/ProjectSharesDetailPage";

const CompanyRoutes = () => {
  return (
    <Routes>
      <Route element={<CompanyLayout />}>
        <Route index element={<CompanyPage />} />
        <Route element={<RequirePermission permission="view_own_salary" />}>
          <Route path="/salaries" element={<SalariesPage />} />
          <Route path="/salaries/:employeeId" element={<SalariesPage />} />
        </Route>

        {/* Gates the route only; no distribution logic is touched. */}
        <Route element={<RequirePermission permission="view_distribution" />}>
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
          {/* Phase 5 — new distribution screens */}
          <Route path="/shares" element={<ProjectSharesListPage />} />
          <Route
            path="/shares/:projectId"
            element={<ProjectSharesDetailPage />}
          />

          <Route path="/dashboard" element={<CompanyOverview />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default CompanyRoutes;
