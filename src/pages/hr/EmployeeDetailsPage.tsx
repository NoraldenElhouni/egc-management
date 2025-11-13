import { useLocation } from "react-router-dom";
import { EmployeeHeader } from "../../components/hr/employee/EmployeeHeader";
import { useEmployee } from "../../hooks/useEmployees";

const EmployeeDetailsPage = () => {
  const location = useLocation();
  const employeeId = location.pathname.split("/")[3];

  const { employee, error, loading } = useEmployee(employeeId);

  if (loading) return <p>Loading users...</p>;
  if (error || !employee)
    return (
      <p style={{ color: "red" }}>
        Error: {error?.message || "Employee not found"}
      </p>
    );
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto px-4 py-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {/* tabs */}
        </div>

        {/* Employee Header */}
        <EmployeeHeader
          firstName={employee.first_name}
          lastName={employee?.last_name || ""}
          department="engenering"
          jobTitle="Software Engineer"
          status="Active"
        />
      </div>
    </div>
  );
};

export default EmployeeDetailsPage;
