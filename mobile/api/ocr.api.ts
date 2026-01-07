import { api } from "./axios";

export type ExtractedExpense = {
  amount: number | null;
  description: string | null;
  merchant: string | null;
  date: string | null;
  type: "debit" | "credit";
  confidence: string;
};

export type OCRResponse = {
  success: boolean;
  data?: {
    extracted: Record<string, unknown>;
    expense: ExtractedExpense;
  };
  error?: string;
};

export const extractFromReceipt = async (
  base64Image: string
): Promise<OCRResponse> => {
  const response = await api.post("/ocr/extract", { image: base64Image }, {
    timeout: 60000,
  });
  return response.data;
};
