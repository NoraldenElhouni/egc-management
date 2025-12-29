import { Route } from "react-router-dom";
import SupplyChainLayout from "../sidebar/SupplyChainLayout";
import SupplyChainPage from "../../pages/supply-chain/SupplyChainPage";
import ContractorPage from "../../pages/supply-chain/ContractorPage";
import NewContractorPage from "../../pages/supply-chain/NewContractorPage";
import ContractorDetailPage from "../../pages/supply-chain/ContractorDetailPage";
import VendorsPage from "../../pages/supply-chain/VendorsPage";
import NewVendorPage from "../../pages/supply-chain/NewVendorPage";
import VendorDetailPage from "../../pages/supply-chain/VendorDetailPage";

const SupplyChainRoutes = () => {
  return (
    <Route element={<SupplyChainLayout />}>
      <Route path="/supply-chain" element={<SupplyChainPage />} />
      <Route path="/supply-chain/contractors" element={<ContractorPage />} />
      <Route
        path="/supply-chain/contractors/new"
        element={<NewContractorPage />}
      />
      <Route
        path="/supply-chain/contractors/:id"
        element={<ContractorDetailPage />}
      />
      <Route path="/supply-chain/vendors" element={<VendorsPage />} />
      <Route path="/supply-chain/vendors/new" element={<NewVendorPage />} />
      <Route path="/supply-chain/vendors/:id" element={<VendorDetailPage />} />
    </Route>
  );
};

export default SupplyChainRoutes;
