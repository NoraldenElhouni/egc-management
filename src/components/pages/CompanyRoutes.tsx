import { Route, Routes } from "react-router-dom";
import CompanyLayout from "../sidebar/CompanyLayout";
import CompanyPage from "../../pages/company/CompanyPage";
import ProjectsDistributePage from "../../pages/company/ProjectsDistributePage";
import CompanyOverview from "../../pages/company/CompanyOverview";
import DistributionBatchesPage from "../company/distribution/DistributionBatchesPage";
import ProjectDistributionDetailPage from "../company/distribution/ProjectDistributionDetailPage";

const CompanyRoutes = () => {
  return (
    <Routes>
      <Route element={<CompanyLayout />}>
        <Route index element={<CompanyPage />} />
        <Route path="/distribute" element={<ProjectsDistributePage />} />

        <Route
          path="/distribute/batches"
          element={<DistributionBatchesPage />}
        />
        <Route
          path="/distribute/project/:projectId"
          element={<ProjectDistributionDetailPage />}
        />
        <Route path="/dashboard" element={<CompanyOverview />} />
      </Route>
    </Routes>
  );
};

export default CompanyRoutes;
