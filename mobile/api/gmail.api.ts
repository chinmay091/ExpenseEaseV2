import { api } from "./axios";

export type GmailTransaction = {
  amount: number;
  type: "debit" | "credit";
  merchant?: string;
  description?: string;
  date?: string;
  source: string;
  emailSubject?: string;
  emailFrom?: string;
  confidence: string;
};

export type GmailFetchResponse = {
  success: boolean;
  data?: {
    totalEmails: number;
    transactions: GmailTransaction[];
  };
  error?: string;
};

export const fetchGmailTransactions = async (
  accessToken: string,
  maxResults: number = 20
): Promise<GmailFetchResponse> => {
  const response = await api.post("/gmail/fetch", { accessToken, maxResults });
  return response.data;
};
