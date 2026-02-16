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
  Account,
  Clients,
  ProjectBalances,
  ProjectPercentage,
  ProjectExpenses,
} from "./global.type";

export type FullProject = Projects & {
  accounts: Account[] | null;
  project_balances: ProjectBalances[];
  project_percentage: ProjectPercentage[];
};

export type ProjectExpenseWithName = ProjectExpenses & {
  projects: { name: string };
};

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

export type FullProjectFinance = Projects & {
  project_expenses: (projectExpensePayments & {
    contract_payments: ContractPaymentWithRelations[];
  })[];
  project_incomes: projectExpensePayments[];
  accounts: Account[] | null;
  clients: Clients | null;
};

export type PayrollWithRelations = Payroll & {
  employees: { first_name: string; last_name: string | null } | null;
};
export type ProjectWithAssignments = Projects & {
  project_percentage:
    | {
        total_percentage: number;
        percentage: number;
        period_percentage: number;
        type?: string | null;
        currency?: string | null;
        period_start: string;
      }[]
    | null;
  project_assignments: Array<{
    user_id: string;
    percentage: number;
    employees: { first_name: string; last_name: string | null } | null;
  }>;
};
