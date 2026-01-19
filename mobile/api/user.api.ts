import { api } from "./axios";

export interface UserData {
  id: string;
  name: string;
  email: string;
  initialBalance: number;
  balanceSetAt: string | null;
  createdAt: string;
}

export const getCurrentUser = async (): Promise<UserData> => {
  const response = await api.get('/users/me');
  return response.data.data;
};

export const setInitialBalance = async (balance: number): Promise<UserData> => {
  const response = await api.put('/users/balance', { balance });
  return response.data.data;
};
