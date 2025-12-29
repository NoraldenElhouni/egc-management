import { Route, Routes } from "react-router-dom";
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
    <Routes>
      <Route element={<SupplyChainLayout />}>
        <Route index element={<SupplyChainPage />} />
        <Route path="contractors" element={<ContractorPage />} />
        <Route path="contractors/new" element={<NewContractorPage />} />
        <Route path="contractors/:id" element={<ContractorDetailPage />} />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="vendors/new" element={<NewVendorPage />} />
        <Route path="vendors/:id" element={<VendorDetailPage />} />
      </Route>
    </Routes>
  );
};

export default SupplyChainRoutes;
