import {
  Employees,
  ContractPayments,
  EmployeeCertifications,
  EmployeesDocuments,
  UserRoles,
  Roles,
  ProjectAssignments,
  Projects,
  ProjectRoles,
  Payroll,
  EmployeeLeaves,
  ExpensePayments,
  Users,
  Currency,
} from "./global.type";

export type ContractPaymentWithRelations = ContractPayments & {
  employee: Employees | null;
  contractors: { first_name: string; last_name: string } | null;
  contracts: { projects: { name: string } } | null;
};

// Project related types (export these for use elsewhere)
export type ProjectAssignmentWithDetails = ProjectAssignments & {
  projects: Projects;
  project_roles: ProjectRoles;
};

export type EmployeeProjects = ProjectAssignmentWithDetails[];

// Main employee type
export type FullEmployee = Employees & {
  employee_certifications: EmployeeCertifications[];
  employee_documents: EmployeesDocuments[];
  user_role?:
    | (UserRoles & {
        roles: Roles;
      })
    | null;
  projects: EmployeeProjects;
  payroll: Payroll[];
  employee_leaves: EmployeeLeaves[];
};

export type projectExpensePayments = ExpensePayments & {
  accounts: { id: string; currency: Currency; type: string } | null;
  users: Users | null;
};

// export interface ClientWithProjects extends Clients {
//   projects: ProjectWithDetails[];
// }

// export interface ProjectWithDetails extends Projects {
//   client: Clients;
//   contracts: ContractWithDetails[];
//   requests: RequestWithItems[];
//   incomes: ProjectIncome[];
//   expenses: ProjectExpenseWithDetails[];
//   specializations: Specializations[];
//   offers: OfferWithItems[];
// }

// export interface ContractWithDetails extends Contracts {
//   project: Projects;
//   contractor?: Contractors;
//   specialization?: Specializations;
//   items: ContractItemWithService[];
//   payments: ContractPayments[];
//   reports: ContractReport[];
// }

// export interface ContractItemWithService extends ContractItems {
//   service: Services;
// }

// export interface RequestWithItems extends Request {
//   project: Projects;
//   items: RequestItemWithService[];
//   bids: BidWithItems[];
//   specialization?: Specializations;
//   assigned_contractor?: Contractors;
// }

// export interface RequestItemWithService extends RequestItem {
//   service: Services;
// }

// export interface BidWithItems extends Bid {
//   contractor: Contractors;
//   items: BidItemWithService[];
//   request: Request;
// }

// export interface BidItemWithService extends BidItems {
//   request_item: RequestItemWithService;
// }

// export interface ProjectExpenseWithDetails extends ProjectExpenses {
//   contract?: Contracts;
//   account?: Account;
//   payments: ExpensePayments[];
// }

// export interface ContractorWithDetails extends Contractors {
//   specializations: Specializations[];
//   contracts: Contracts[];
//   bids: Bid[];
// }

// export interface EmployeeWithDetails extends Employees {
//   department: Departments;
//   specialization: Specializations;
//   history: EmployeeHistory[];
// }

// export interface OfferWithItems extends Offers {
//   project: Projects;
//   items: OfferItemWithService[];
//   created_by_user: Users;
// }

// export interface OfferItemWithService extends OfferItems {
//   service: Services;
// }

// export interface UserWithRoles extends Users {
//   role: Roles;
//   user_roles: UserRoles[];
//   permissions: Permissions[];
// }

// // Enum types (based on your USER-DEFINED types)
// export type ProjectStatus = "active" | "completed" | "on_hold" | "cancelled";
// export type PaymentMethod = "cash" | "bank_transfer" | "check" | "credit_card";
// export type AccountType = "checking" | "savings" | "business";
// export type AccountOwnerType = "company" | "contractor" | "client";
// export type Currency = "USD" | "EUR" | "GBP" | "local";
// export type TransactionType = "income" | "expense" | "transfer";
// export type ExpenseType = "material" | "labor" | "equipment" | "overhead";
// export type ProjectPhase = "planning" | "design" | "execution" | "completion";
// export type FundType = "client_payment" | "loan" | "investment" | "other";
