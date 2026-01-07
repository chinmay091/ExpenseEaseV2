import { api } from "./axios";

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  reminderDays: number;
  categoryId: string | null;
  isPaid: boolean;
  lastPaidAt: string | null;
  isActive: boolean;
  Category?: { id: string; name: string };
  daysUntilDue?: number;
}

export interface CreateBillPayload {
  name: string;
  amount: number;
  dueDay: number;
  frequency?: 'weekly' | 'monthly' | 'yearly';
  reminderDays?: number;
  categoryId?: string;
}

export const getBills = async (): Promise<Bill[]> => {
  const response = await api.get('/bills');
  return response.data;
};

export const getUpcomingBills = async (days?: number): Promise<Bill[]> => {
  const response = await api.get('/bills/upcoming', { params: { days } });
  return response.data;
};

export const getBill = async (id: string): Promise<Bill> => {
  const response = await api.get(`/bills/${id}`);
  return response.data;
};

export const createBill = async (payload: CreateBillPayload): Promise<Bill> => {
  const response = await api.post('/bills', payload);
  return response.data;
};

export const updateBill = async (id: string, payload: Partial<CreateBillPayload>): Promise<Bill> => {
  const response = await api.patch(`/bills/${id}`, payload);
  return response.data;
};

export const deleteBill = async (id: string): Promise<{ success: boolean }> => {
  const response = await api.delete(`/bills/${id}`);
  return response.data;
};

export const markBillPaid = async (id: string): Promise<{ success: boolean; expense: unknown; bill: Bill }> => {
  const response = await api.post(`/bills/${id}/pay`);
  return response.data;
};
