import { api } from "./axios";

export type SmsMessage = {
  body: string;
  address?: string;
  date?: number;
};

export type ParsedTransaction = {
  amount: number;
  type: "debit" | "credit";
  merchant?: string;
  description?: string;
  date?: string;
  account?: string;
  source: string;
  confidence: string;
  rawMessage?: string;
};

export type SmsParseResponse = {
  success: boolean;
  data?: {
    totalMessages: number;
    filteredCount: number;
    transactions: ParsedTransaction[];
  };
  error?: string;
};

export const parseSmsMessages = async (
  messages: SmsMessage[]
): Promise<SmsParseResponse> => {
  const response = await api.post("/sms/parse", { messages });
  return response.data;
};
