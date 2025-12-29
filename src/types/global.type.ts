// types/database.ts
import { Database, Tables } from "../lib/supabase";

export type Currency = "LYD" | "USD" | "EUR";

export type PaymentMethod = Database["public"]["Enums"]["payment_method"];

// Core entity types
export type Clients = Tables<"clients">;
export type Specializations = Tables<"specializations">;
export type Contractors = Tables<"contractors">;
export type Contracts = Tables<"contracts">;
export type ContractItems = Tables<"contract_items">;
export type ContractPayments = Tables<"contract_payments">;
export type Projects = Tables<"projects">;
export type Employees = Tables<"employees">;
export type EmployeeCertifications = Tables<"employee_certifications">;
export type EmployeesDocuments = Tables<"employee_documents">;
export type Request = Tables<"requests">;
export type Bid = Tables<"bids">;
export type RequestItem = Tables<"request_items">;
export type ContractReport = Tables<"contract_reports">;
export type ProjectIncome = Tables<"project_incomes">;
export type ProjectRefund = Tables<"project_refund">;
export type Services = Tables<"services">;
export type ProjectExpenses = Tables<"project_expenses">;
export type Account = Tables<"accounts">;
export type Users = Tables<"users">;
export type Roles = Tables<"roles">;
export type Permissions = Tables<"permissions">;
export type Offers = Tables<"offers">;
export type OfferItems = Tables<"offer_items">;
export type BidItems = Tables<"bid_items">;
export type Company = Tables<"company">;
export type AuditLog = Tables<"audit_log">;
export type EmployeeLeaves = Tables<"employee_leaves">;
export type Payroll = Tables<"payroll">;
export type Vendor = Tables<"vendors">;
export type expenses = Tables<"expenses">;

// Additional types for tables not in your original export
export type ContractorSpecializations = Tables<"contractor_specializations">;
export type EmployeeHistory = Tables<"employee_history">;
export type ExpensePayments = Tables<"expense_payments">;
export type ProjectAssignments = Tables<"project_assignments">;
export type ProjectRoles = Tables<"project_roles">;
export type ProjectSpecializations = Tables<"project_specializations">;
export type ProjectBalances = Tables<"project_balances">;
export type ProjectPercentage = Tables<"project_percentage">;
export type RolePermissions = Tables<"role_permissions">;
export type SpecializationPermissions = Tables<"specialization_permissions">;
export type UserPermissions = Tables<"user_permissions">;
export type UserRoles = Tables<"user_roles">;
export type UserSpecializations = Tables<"user_specializations">;
export type MapType = Tables<"map_types">;

export type ButtonVariant =
  | "primary"
  | "primary-light"
  | "primary-outline"
  | "secondary"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "ghost"
  | "muted";
