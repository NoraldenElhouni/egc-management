import React from "react";
import { useParams } from "react-router-dom";

const ExpenseInvoice = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  if (!invoiceId) {
    return <div>Project ID is missing</div>;
  }
  return <div>ExpenseInvoice {invoiceId}</div>;
};

export default ExpenseInvoice;
