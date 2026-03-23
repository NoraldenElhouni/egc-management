import React from "react";
import CompanyExpenseForm from "./CompanyExpenseForm";
import { CompanyExpense } from "../../../types/global.type";
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
