import { api } from "./axios";

export interface Goal {
  id: string;
  name: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  autoSavePercent: number | null;
  deadline: string | null;
  status: "active" | "completed" | "cancelled";
  icon: string;
  color: string;
  completedAt: string | null;
  createdAt: string;
  // Computed fields
  progress: number;
  remaining: number;
  daysRemaining: number | null;
  monthlyRequired: number | null;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  note: string | null;
  isAutomatic: boolean;
  createdAt: string;
}

export interface CreateGoalPayload {
  name: string;
  description?: string;
  targetAmount: number;
  autoSavePercent?: number;
  deadline?: string;
  icon?: string;
  color?: string;
}

export interface UpdateGoalPayload {
  name?: string;
  description?: string;
  targetAmount?: number;
  autoSavePercent?: number;
  deadline?: string;
  icon?: string;
  color?: string;
  status?: "active" | "completed" | "cancelled";
}

export interface ContributePayload {
  amount: number;
  note?: string;
}

interface GoalsResponse {
  success: boolean;
  data: Goal[];
}

interface GoalResponse {
  success: boolean;
  data: Goal;
}

interface GoalDetailResponse {
  success: boolean;
  data: Goal & { contributions: GoalContribution[] };
}

interface ContributionResponse {
  success: boolean;
  data: {
    success: boolean;
    contribution: GoalContribution;
    goal: Goal;
  };
}

interface ContributionsResponse {
  success: boolean;
  data: GoalContribution[];
}

// Get all goals
export const getGoals = async (status?: string): Promise<Goal[]> => {
  const params = status ? { status } : {};
  const response = await api.get<GoalsResponse>("/goals", { params });
  return response.data.data;
};

// Get single goal with contributions
export const getGoalById = async (id: string): Promise<Goal & { contributions: GoalContribution[] }> => {
  const response = await api.get<GoalDetailResponse>(`/goals/${id}`);
  return response.data.data;
};

// Create a new goal
export const createGoal = async (payload: CreateGoalPayload): Promise<Goal> => {
  const response = await api.post<GoalResponse>("/goals", payload);
  return response.data.data;
};

// Update a goal
export const updateGoal = async (id: string, payload: UpdateGoalPayload): Promise<Goal> => {
  const response = await api.put<GoalResponse>(`/goals/${id}`, payload);
  return response.data.data;
};

// Delete a goal
export const deleteGoal = async (id: string): Promise<void> => {
  await api.delete(`/goals/${id}`);
};

// Add contribution to goal
export const contributeToGoal = async (id: string, payload: ContributePayload): Promise<ContributionResponse["data"]> => {
  const response = await api.post<ContributionResponse>(`/goals/${id}/contribute`, payload);
  return response.data.data;
};

// Get contribution history
export const getContributions = async (goalId: string): Promise<GoalContribution[]> => {
  const response = await api.get<ContributionsResponse>(`/goals/${goalId}/contributions`);
  return response.data.data;
};
