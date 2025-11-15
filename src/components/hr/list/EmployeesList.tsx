import { useEffect, useState } from "react";
import { EmployeesColumns } from "../../tables/columns/EmployeesColumns";
import GenericTable from "../../tables/table";
import { Employees } from "../../../types/global.type";
import { supabase } from "../../../lib/supabaseClient";

const EmployeesList = () => {
  const [employees, setEmployees] = useState<Employees[]>([]);

  useEffect(() => {
    // Fetch employees data from your API or service
    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase.from("employees").select("*");
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
