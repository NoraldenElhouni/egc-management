import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import { useState } from "react";
import EmployeesList from "../../components/hr/list/EmployeesList";

const HrPage = () => {
  const [loading, setLoading] = useState(false);
  return (
    <div className="bg-background  text-foreground">
      <header className="flex items-center justify-between gap-4 mb-6"></header>
      <main>
        <h2 className="text-foreground">
          مرحبًا بك في صفحة إدارة الموارد البشرية
        </h2>
        <div className="flex flex-col w-fit space-y-2">
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
          <Button variant="error">Payrole</Button>
          <Button variant="accent">Lone & advance</Button>
          <Button variant="ghost">Attendance & holidays</Button>
          <Button variant="info">Announcement</Button>
          <Button variant="muted">Rest password</Button>
          <Button variant="primary-light">btn test</Button>
          <Button variant="primary-outline">btn test</Button>
          <Button variant="secondary">btn test</Button>
          <Button variant="success">btn test</Button>
          <Button
            variant="warning"
            loading={loading}
            size="sm"
            onClick={() => setLoading(!loading)}
          >
            btn test
          </Button>
        </div>
        <div>
          <EmployeesList />
        </div>
      </main>
    </div>
  );
};

export default HrPage;
