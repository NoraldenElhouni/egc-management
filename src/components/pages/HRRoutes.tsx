import { Routes, Route } from "react-router-dom";
import HRLayout from "../sidebar/HRLayout";
import HrPage from "../../pages/hr/HrPage";
import NewEmployeePage from "../../pages/hr/NewEmployeePage";
import MonthlyPayrollPage from "../../pages/hr/payroll/MonthlyPayrollPage";
import PercentagesPayrollPage from "../../pages/hr/payroll/PercentagesPayrollPage";
import ProjectPercentagesPayrollPage from "../../pages/hr/payroll/project/ProjectPercentagesPayrollPage";
import MapsPayrollPage from "../../pages/hr/payroll/MapsPayrollPage";
import ProjectMapsPayrollPage from "../../pages/hr/payroll/project/ProjectMapsPayrollPage";
import PayrollPage from "../../pages/hr/payroll/PayrollPage";
import PayrollDetailedPage from "../../pages/hr/payroll/PayrollDetailedPage";
import LoansAdvancesPage from "../../pages/hr/LoansAdvancesPage";
import AttendancePage from "../../pages/hr/AttendancePage";
import AnnouncementsPage from "../../pages/hr/AnnouncementsPage";
import RestPasswordPage from "../../pages/hr/RestPasswordPage";
import EmployeesPage from "../../pages/hr/EmployeesPage";
import EmployeeDetailsPage from "../../pages/hr/EmployeeDetailsPage";

export default function HRRoutes() {
  return (
    <Routes>
      <Route element={<HRLayout />}>
        <Route index element={<HrPage />} />

        <Route path="employees" element={<EmployeesPage />} />
        <Route path="employees/new" element={<NewEmployeePage />} />
        <Route path="employees/:id" element={<EmployeeDetailsPage />} />
        <Route path="employees/:id/edit" element={<EmployeesPage />} />

        <Route path="payroll" element={<PayrollPage />} />
        <Route path="payroll/:id" element={<PayrollDetailedPage />} />
        <Route path="payroll/monthly" element={<MonthlyPayrollPage />} />
        <Route
          path="payroll/percentages"
          element={<PercentagesPayrollPage />}
        />
        <Route
          path="payroll/percentages/:projectId"
          element={<ProjectPercentagesPayrollPage />}
        />
        <Route path="payroll/maps" element={<MapsPayrollPage />} />
        <Route
          path="payroll/maps/:projectId"
          element={<ProjectMapsPayrollPage />}
        />

        <Route path="loans-advances" element={<LoansAdvancesPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="rest-password" element={<RestPasswordPage />} />
      </Route>
    </Routes>
  );
}
