import { Routes, Route } from "react-router-dom";
import RequirePermission from "../auth/RequirePermission";
import HRLayout from "../sidebar/HRLayout";
import HrPage from "../../pages/hr/HrPage";
import NewEmployeePage from "../../pages/hr/NewEmployeePage";
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
        <Route element={<RequirePermission permission="view_employees" />}>
          <Route index element={<HrPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="employees/:id" element={<EmployeeDetailsPage />} />
          <Route path="employees/:id/edit" element={<EmployeesPage />} />
        </Route>
        <Route element={<RequirePermission permission="create_employee" />}>
          <Route path="employees/new" element={<NewEmployeePage />} />
        </Route>

        <Route path="loans-advances" element={<LoansAdvancesPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="rest-password" element={<RestPasswordPage />} />
      </Route>
    </Routes>
  );
}
