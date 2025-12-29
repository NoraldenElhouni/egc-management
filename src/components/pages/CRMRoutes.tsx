import { Route } from "react-router-dom";
import CRMLayout from "../sidebar/CRMLayout";
import CrmPage from "../../pages/crm/crmPage";
import NewClientPage from "../../pages/crm/NewClientPage";
import ClientDetailPage from "../../pages/crm/ClientDetailPage";

const CRMRoutes = () => {
  return (
    <Route element={<CRMLayout />}>
      <Route path="/crm" element={<CrmPage />} />
      <Route path="/crm/clients/new" element={<NewClientPage />} />
      <Route path="/crm/clients/:id" element={<ClientDetailPage />} />
    </Route>
  );
};

export default CRMRoutes;
