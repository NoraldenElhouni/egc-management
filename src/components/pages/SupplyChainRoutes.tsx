import { Route, Routes } from "react-router-dom";
import RequirePermission from "../auth/RequirePermission";
import SupplyChainLayout from "../sidebar/SupplyChainLayout";
import SupplyChainPage from "../../pages/supply-chain/SupplyChainPage";
import ContractorPage from "../../pages/supply-chain/contractor/ContractorPage";
import NewContractorPage from "../../pages/supply-chain/contractor/NewContractorPage";
import ContractorDetailPage from "../../pages/supply-chain/contractor/ContractorDetailPage";
import VendorsPage from "../../pages/supply-chain/VendorsPage";
import NewVendorPage from "../../pages/supply-chain/NewVendorPage";
import VendorDetailPage from "../../pages/supply-chain/VendorDetailPage";
import ContractorBidsPage from "../../pages/supply-chain/contractor/ContractorBidsPage";
import ContractorContractsPage from "../../pages/supply-chain/contractor/ContractorContractsPage";
import ContractorPaymentsPage from "../../pages/supply-chain/contractor/ContractorPaymentsPage";

const SupplyChainRoutes = () => {
  return (
    <Routes>
      {/* Issue #19 gap 4: was one permission (view_contractors) for the
          whole section. Every leaf route now gates on its own permission,
          using the already-existing, previously-unwired catalog entries
          built for exactly this. */}
      <Route element={<SupplyChainLayout />}>
        <Route element={<RequirePermission permission="view_contractors" />}>
          <Route index element={<SupplyChainPage />} />
          <Route path="contractors" element={<ContractorPage />} />
          {/* profile */}
          <Route
            path="contractors/:contractorId"
            element={<ContractorDetailPage />}
          />
          {/* their contracts — no dedicated "contractor contracts" permission
              exists in the catalog, so this stays on the section's base
              permission rather than borrowing a differently-scoped one
              (view_project_contracts is about a project's own contract
              register, not a contractor's contracts across projects). */}
          <Route
            path="contractors/:contractorId/contracts"
            element={<ContractorContractsPage />}
          />
        </Route>
        <Route element={<RequirePermission permission="manage_contractors" />}>
          <Route path="contractors/new" element={<NewContractorPage />} />
        </Route>
        <Route
          element={<RequirePermission permission="view_contractor_bids" />}
        >
          {/* their bids */}
          <Route
            path="contractors/:contractorId/bids"
            element={<ContractorBidsPage />}
          />
        </Route>
        <Route
          element={
            <RequirePermission permission="view_contractor_payments" />
          }
        >
          {/* payment history */}
          <Route
            path="contractors/:contractorId/payments"
            element={<ContractorPaymentsPage />}
          />
        </Route>
        <Route element={<RequirePermission permission="view_vendors" />}>
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="vendors/:id" element={<VendorDetailPage />} />
        </Route>
        <Route element={<RequirePermission permission="manage_vendors" />}>
          <Route path="vendors/new" element={<NewVendorPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default SupplyChainRoutes;
