import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import EmployeesList from "../../components/hr/list/EmployeesList";

const HrPage = () => {
  return (
    <div className="bg-background p-6 text-foreground">
      <main>
        <div className="flex flex-row w-fit space-x-2">
          <Link to="/hr/employees/new">
            <Button>إضافة موظف جديد</Button>
          </Link>
          <Link to="/hr/payroll">الرواتب</Link>
          <Link to="/hr/loans-advances">القروض والسلف</Link>
          <Link to="/hr/attendance">الحضور والإجازات</Link>
          <Link to="/hr/announcements">الإعلانات</Link>
          <Link to="/hr/rest-password">إعادة تعيين كلمة المرور</Link>
        </div>
        <div>
          <EmployeesList />
        </div>
      </main>
    </div>
  );
};

export default HrPage;
