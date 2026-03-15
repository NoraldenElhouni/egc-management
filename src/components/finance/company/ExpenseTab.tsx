import React from "react";
import CompanyExpenseForm from "./CompanyExpenseForm";
import { CompanyExpense } from "../../../types/global.type";
import { Link } from "react-router-dom";
import GenericTable from "../../tables/table";
import { CompanyInvoiceColumns } from "../../tables/columns/CompanyInvoiceColumns";
import { CompanyExpenseFormValues } from "../../../types/schema/companyFinance.schema";
import { PostgrestError } from "@supabase/supabase-js";

type AddExpenseResult =
  | { success: true }
  | { success: false; error?: PostgrestError | string; message?: string };

type AddExpenseFunction = (
  form: CompanyExpenseFormValues,
) => Promise<AddExpenseResult>;

interface ExpenseTabProps {
  expenses: CompanyExpense[];
  onAddExpense: AddExpenseFunction;
}

const ExpenseTab = ({ expenses, onAddExpense }: ExpenseTabProps) => {
  return (
    <div>
      <CompanyExpenseForm onAddExpense={onAddExpense} />
      <div>
        <Link to={"/finance/company/132413"}>ExpenseTab</Link>
      </div>
      <div>
        <GenericTable
          enableFiltering
          showGlobalFilter
          enableSorting
          enableRowSelection
          initialSorting={[{ id: "reference_id", desc: true }]}
          data={expenses || []}
          columns={CompanyInvoiceColumns}
        />
      </div>
    </div>
  );
};

export default ExpenseTab;
