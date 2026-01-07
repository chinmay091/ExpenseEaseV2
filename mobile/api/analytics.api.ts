import { api } from "./axios";

export interface AnalyticsData {
  currentMonth: MonthSummary;
  lastMonth: MonthSummary;
  comparison: Comparison;
  categoryComparison: CategoryComparison[];
  trend: TrendPoint[];
  insights: Insight[];
}

interface MonthSummary {
  totalSpending: number;
  totalIncome: number;
  netSavings: number;
  transactionCount: number;
  categories: CategoryData[];
  topCategory: string | null;
}

interface CategoryData {
  name: string;
  amount: number;
  percent: string;
}

interface Comparison {
  spending: { current: number; previous: number; change: number };
  income: { current: number; previous: number; change: number };
}

interface CategoryComparison {
  name: string;
  current: number;
  previous: number;
  change: number;
}

interface TrendPoint {
  month: string;
  total: number;
}

interface Insight {
  type: 'success' | 'warning' | 'info';
  title: string;
  text: string;
}

export const getAnalytics = async (): Promise<AnalyticsData> => {
  const response = await api.get('/analytics');
  return response.data;
};
