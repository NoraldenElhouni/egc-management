import { Route, Routes } from "react-router-dom";
import RequirePermission from "../auth/RequirePermission";
import CRMLayout from "../sidebar/CRMLayout";
import CrmPage from "../../pages/crm/crmPage";
import NewClientPage from "../../pages/crm/NewClientPage";
import ClientDetailPage from "../../pages/crm/ClientDetailPage";

const CRMRoutes = () => {
  return (
    <Routes>
      {/* Issue #19 gap 4: was one permission (view_clients) for the whole
          section. Every leaf route now gates on its own permission — this
          also activates manage_clients, which HR already held but could
          never reach because the old coarse gate required view_clients. */}
      <Route element={<CRMLayout />}>
        <Route element={<RequirePermission permission="view_clients" />}>
          <Route index element={<CrmPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
        </Route>
        <Route element={<RequirePermission permission="manage_clients" />}>
          <Route path="/clients/new" element={<NewClientPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default CRMRoutes;
