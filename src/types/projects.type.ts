import {
  ProjectBalances,
  ProjectExpenses,
  ProjectIncome,
  Projects,
} from "./global.type";

export interface ProjectWithDetailsForBook extends Projects {
  project_incomes: ProjectIncome[];
  project_expenses: ProjectExpenses[];
  project_balances: ProjectBalances[];
}
