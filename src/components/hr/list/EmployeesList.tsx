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
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        User Management (with multi-select)
      </h2>
      <GenericTable
        data={employees}
        columns={EmployeesColumns}
        enableSorting
        enablePagination
        enableFiltering
        enableRowSelection
        showGlobalFilter
        onRowSelectionChange={(selected) =>
          console.log("Selected rows:", selected)
        }
      />
    </div>
  );
};

export default EmployeesList;
