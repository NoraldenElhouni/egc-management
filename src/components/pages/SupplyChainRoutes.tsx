import { Route, Routes } from "react-router-dom";
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
      <Route element={<SupplyChainLayout />}>
        <Route index element={<SupplyChainPage />} />
        <Route path="contractors" element={<ContractorPage />} />
        <Route path="contractors/new" element={<NewContractorPage />} />
        {/* profile */}
        <Route path="contractors/:id" element={<ContractorDetailPage />} />
        {/* their bids */}
        <Route path="contractors/:id/bids" element={<ContractorBidsPage />} />
        {/* their contracts */}
        <Route
          path="contractors/:id/contracts"
          element={<ContractorContractsPage />}
        />
        {/* payment history  */}
        <Route
          path="contractors/:id/payments"
          element={<ContractorPaymentsPage />}
        />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="vendors/new" element={<NewVendorPage />} />
        <Route path="vendors/:id" element={<VendorDetailPage />} />
      </Route>
    </Routes>
  );
};

export default SupplyChainRoutes;
