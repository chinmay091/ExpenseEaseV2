import { api } from "./axios";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  icon: string;
  isActive: boolean;
  members: GroupMember[];
  myBalance?: number;
  myMemberId?: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  status: 'pending' | 'joined' | 'declined';
  balance: number;
}

export interface GroupExpense {
  id: string;
  groupId: string;
  paidById: string;
  amount: number;
  description: string;
  splitType: 'equal' | 'exact' | 'percent';
  createdAt: string;
  paidBy: { id: string; name: string };
  splits: Split[];
}

export interface Split {
  id: string;
  groupExpenseId: string;
  memberId: string;
  amount: number;
  settled: boolean;
  settledAt: string | null;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  icon?: string;
}

export interface AddMemberPayload {
  name: string;
  email?: string;
  phone?: string;
}

export interface AddExpensePayload {
  paidById: string;
  amount: number;
  description: string;
  splitType?: 'equal' | 'exact' | 'percent';
  splits?: { memberId: string; amount: number }[];
}

export const getGroups = async (): Promise<Group[]> => {
  const response = await api.get('/groups');
  return response.data;
};

export const getGroup = async (id: string): Promise<Group> => {
  const response = await api.get(`/groups/${id}`);
  return response.data;
};

export const createGroup = async (payload: CreateGroupPayload): Promise<Group> => {
  const response = await api.post('/groups', payload);
  return response.data;
};

export const addMember = async (groupId: string, payload: AddMemberPayload): Promise<GroupMember> => {
  const response = await api.post(`/groups/${groupId}/members`, payload);
  return response.data;
};

export const respondToInvite = async (groupId: string, accept: boolean): Promise<{ status: string }> => {
  const response = await api.post(`/groups/${groupId}/respond`, { accept });
  return response.data;
};

export const addGroupExpense = async (groupId: string, payload: AddExpensePayload): Promise<{ expense: GroupExpense; splits: Split[] }> => {
  const response = await api.post(`/groups/${groupId}/expenses`, payload);
  return response.data;
};

export const settleSplit = async (groupId: string, splitId: string, memberId: string): Promise<Split> => {
  const response = await api.post(`/groups/${groupId}/settle`, { splitId, memberId });
  return response.data;
};

export const getBalances = async (groupId: string): Promise<{ id: string; name: string; balance: number }[]> => {
  const response = await api.get(`/groups/${groupId}/balances`);
  return response.data;
};

export const deleteGroup = async (id: string): Promise<{ success: boolean }> => {
  const response = await api.delete(`/groups/${id}`);
  return response.data;
};
