import {
  Account,
  ProjectBalances,
  ProjectExpenses,
  ProjectIncome,
  ProjectRefund,
  Projects,
} from "./global.type";

export interface ProjectWithDetailsForBook extends Projects {
  accounts: Account[];
  project_incomes: ProjectIncome[];
  project_expenses: ProjectExpenses[];
  project_balances: ProjectBalances[];
  project_refund: ProjectRefund[];
}
