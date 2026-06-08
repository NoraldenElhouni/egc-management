import { useEffect, useState } from "react";
import { EmployeesColumns } from "../../tables/columns/EmployeesColumns";
import GenericTable from "../../tables/table";
import { Employees, Roles } from "../../../types/global.type";
import { supabase } from "../../../lib/supabaseClient";

export interface employeesWithRole extends Employees {
  users: {
    roles: Roles;
  };
}

const EmployeesList = () => {
  const [employees, setEmployees] = useState<employeesWithRole[]>([]);

  useEffect(() => {
    // Fetch employees data from your API or service
    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*, users(roles!users_role_id_fkey(*))");
        if (error) {
          throw error;
        }
        setEmployees(data);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployees();
  }, []);
  return (
    <div>
      <GenericTable
        data={employees}
        columns={EmployeesColumns}
        enableSorting
        enablePagination
        enableFiltering
        enableRowSelection
        showGlobalFilter
      />
    </div>
  );
};

export default EmployeesList;
