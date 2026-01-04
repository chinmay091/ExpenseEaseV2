import { api } from "./axios";

export type CreateExpensePayload = {
  amount: number;
  description?: string;
  type: "credit" | "debit";
  categoryId: string;
};

export type Expense = {
  id: string;
  amount: number;
  description: string;
  type: "credit" | "debit";
  categoryId: string;
  createdAt: string;
};

export type UpdateExpensePayload = {
  amount: number;
  description: string;
  type: "debit" | "credit";
  categoryId: string;
};

export const createExpense = async (
  payload: CreateExpensePayload
) => {
  const response = await api.post("/expenses", payload);
  return response.data;
};

export const getExpenses = async (): Promise<Expense[]> => {
  const response = await api.get("/expenses");

  return response.data.data;
};

export const deleteExpense = async (id: string) => {
  await api.delete(`/expenses/${id}`);
};

export const updateExpense = async (id: string, payload: UpdateExpensePayload) => {
  const response = await api.patch(`/expenses/${id}`, payload);

  return response.data;
};