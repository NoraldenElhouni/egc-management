import { Routes, Route } from "react-router-dom";
import OperationsPage from "../../pages/operations/OperationsPage";
import OperationsLayout from "../sidebar/OperationsLayout";
import MapsRoutes from "./operateions/maps/MapsRoutes";
import ContractsRoutes from "./operateions/contracts/ContractsRoutes";
import BOQRoutes from "./operateions/BOQ/BOQRoutes";

export default function OperationsRoutes() {
  return (
    <Routes>
      <Route element={<OperationsLayout />}>
        <Route index element={<OperationsPage />} />
        <Route path="maps/*" element={<MapsRoutes />} />
        <Route path="contracts/*" element={<ContractsRoutes />} />
        <Route path="boq/*" element={<BOQRoutes />} />
      </Route>
    </Routes>
  );
}
