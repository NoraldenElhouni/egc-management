import React from "react";
import CompanyExpenseForm from "./CompanyExpenseForm";
import { CompanyExpense } from "../../../types/global.type";
import { Link } from "react-router-dom";
import GenericTable from "../../tables/table";
import { CompanyInvoiceColumns } from "../../tables/columns/CompanyInvoiceColumns";

interface ExpenseTabProps {
  expenses: CompanyExpense[];
}

const ExpenseTab = ({ expenses }: ExpenseTabProps) => {
  return (
    <div>
      <CompanyExpenseForm companyId="f1103f66-861b-42ce-a91d-bb9f73bb1945" />
      <div>
        <Link to={"/finance/company/132413"}>ExpenseTab</Link>
      </div>
      <div>
        <GenericTable
          enableFiltering
          showGlobalFilter
          enableSorting
          enableRowSelection
          initialSorting={[{ id: "serial_number", desc: true }]}
          data={expenses || []}
          columns={CompanyInvoiceColumns}
        />
      </div>
    </div>
  );
};

export default ExpenseTab;
