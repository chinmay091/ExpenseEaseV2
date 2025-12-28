import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  validateBudgetExplanationBatch,
} from "../validator/budgetExplanation.schema.js";

const LLM_ENABLED = process.env.LLM_ENABLED === "true";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  temperature: 0.3,
  apiKey: process.env.GOOGLE_API_KEY,
  maxRetries: 0,
});

const batchExplanationPrompt = new PromptTemplate({
  inputVariables: ["budgets"],
  template: `
You are a personal finance assistant.

For each budget item, explain why the budget was set.

STRICT RULES (must follow):
- Return ONLY raw JSON
- DO NOT use markdown
- DO NOT wrap in triple backticks
- DO NOT include \`\`\`json
- DO NOT add explanations outside JSON
- Output must start with {{ and end with }}

Each explanation:
- Max 2 sentences
- Simple language
- No investment advice

Input:
{budgets}

Return a JSON object where:
- Keys are category IDs
- Values are explanation strings
`,
});

export const generateBudgetExplanationsBatch = async (inputs) => {
  if (!LLM_ENABLED) {
    const fallback = {};
    for (const b of inputs) {
      fallback[b.category] =
        "This budget is based on your recent spending patterns.";
    }
    return fallback;
  }

  const validated = validateBudgetExplanationBatch(inputs);

  const chain = batchExplanationPrompt.pipe(llm);

  const payload = JSON.stringify(
    validated.map((b) => ({
      category: b.category,
      avgSpend: b.avgMonthlySpend,
      budget: b.suggestedBudget,
      mlUsed: b.mlUsed,
      trend: b.trend ?? "N/A",
      volatility: b.volatility ?? "N/A",
      buffer: b.bufferPercent,
      months: b.monthsAnalyzed,
    }))
  );

  const response = await chain.invoke({ budgets: payload });

  try {
    return JSON.parse(response.content);
  } catch (err) {
    console.error("Gemini JSON parse failed:", response.content);
    return {};
  }
};
