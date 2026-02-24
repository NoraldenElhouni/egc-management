import { Route, Routes } from "react-router-dom";
import NewClientPage from "../../pages/crm/NewClientPage";
import ClientDetailPage from "../../pages/crm/ClientDetailPage";
import CompanyLayout from "../sidebar/CompanyLayout";
import CompanyPage from "../../pages/company/CompanyPage";

const CompanyRoutes = () => {
  return (
    <Routes>
      <Route element={<CompanyLayout />}>
        <Route index element={<CompanyPage />} />
        <Route path="/clients/new" element={<NewClientPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
      </Route>
    </Routes>
  );
};

export default CompanyRoutes;
