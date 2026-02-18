import {
  Account,
  ProjectBalances,
  ProjectExpenses,
  ProjectIncome,
  ProjectMaps,
  ProjectRefund,
  Projects,
} from "./global.type";

export interface Expense extends ProjectExpenses {
  vendor_name?: string;
  contract_name?: string;
}

export interface ProjectWithDetailsForBook extends Projects {
  accounts: Account[];
  project_incomes: ProjectIncome[];
  project_expenses: Expense[];
  project_balances: ProjectBalances[];
  project_refund: ProjectRefund[];
  project_maps: ProjectMaps[];
}

export interface ProjectWithIncome extends Projects {
  project_incomes: ProjectIncome[];
}
