import { Route, Routes } from "react-router-dom";
import RequirePermission from "../auth/RequirePermission";
import CRMLayout from "../sidebar/CRMLayout";
import CrmPage from "../../pages/crm/crmPage";
import NewClientPage from "../../pages/crm/NewClientPage";
import ClientDetailPage from "../../pages/crm/ClientDetailPage";

const CRMRoutes = () => {
  return (
    <Routes>
      <Route element={<RequirePermission permission="view_clients" />}>
        <Route element={<CRMLayout />}>
          <Route index element={<CrmPage />} />
          <Route path="/clients/new" element={<NewClientPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default CRMRoutes;
