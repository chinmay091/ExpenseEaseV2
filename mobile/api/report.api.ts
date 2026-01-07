import { api } from "./axios";

export interface ReportPeriod {
  year: number;
  month: number;
  label: string;
}

export interface CategoryBreakdown {
  name: string;
  amount: number;
  percent: string | number;
}

export interface BudgetComparison {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  overBudget: boolean;
}

export interface Transaction {
  date: string;
  description: string;
  category: string;
  type: "debit" | "credit";
  amount: number;
}

export interface ReportData {
  period: string;
  periodName: string;
  summary: {
    totalSpending: number;
    totalIncome: number;
    netSavings: number;
    transactionCount: number;
  };
  categoryBreakdown: CategoryBreakdown[];
  budgetComparison: BudgetComparison[];
  transactions: Transaction[];
}

// Get available report periods
export const getReportPeriods = async (): Promise<ReportPeriod[]> => {
  const response = await api.get<{ success: boolean; data: ReportPeriod[] }>(
    "/reports/periods"
  );
  return response.data.data;
};

// Get report data for a specific month
export const getReportData = async (
  year: number,
  month: number
): Promise<ReportData> => {
  const response = await api.get<{ success: boolean; data: ReportData }>(
    `/reports?year=${year}&month=${month}`
  );
  return response.data.data;
};

// Get CSV download URL
export const getCSVDownloadUrl = (year: number, month: number): string => {
  return `/reports/csv?year=${year}&month=${month}`;
};
