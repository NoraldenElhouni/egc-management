import { Route, Routes } from "react-router-dom";
import CompanyLayout from "../sidebar/CompanyLayout";
import CompanyPage from "../../pages/company/CompanyPage";
import ProjectsDistributePage from "../../pages/company/ProjectsDistributePage";
import DistributionHistoryPage from "../../pages/company/DistributionHistoryPage";
import CompanyOverview from "../../pages/company/CompanyOverview";

const CompanyRoutes = () => {
  return (
    <Routes>
      <Route element={<CompanyLayout />}>
        <Route index element={<CompanyPage />} />
        <Route path="/distribute" element={<ProjectsDistributePage />} />
        <Route
          path="/distribute/history"
          element={<DistributionHistoryPage />}
        />
        <Route path="/dashboard" element={<CompanyOverview />} />
      </Route>
    </Routes>
  );
};

export default CompanyRoutes;
