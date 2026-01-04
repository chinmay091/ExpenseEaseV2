import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  validateBudgetExplanationBatch,
} from "../validator/budgetExplanation.schema.js";

const LLM_ENABLED = process.env.LLM_ENABLED === "true";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash-lite",
  temperature: 0.4,
  apiKey: process.env.GOOGLE_API_KEY,
  maxRetries: 1,
});

const batchExplanationPrompt = new PromptTemplate({
  inputVariables: ["budgets", "currency"],
  template: `You are a friendly personal finance coach helping someone understand their spending budgets.

CONTEXT: The user is viewing their monthly budgets. Each budget was auto-generated based on their spending history.

INPUT DATA:
{budgets}

YOUR TASK: For each category, write a personalized insight that:
1. Acknowledges their spending pattern (use the trend and volatility data)
2. Explains why this budget makes sense for them
3. Gives ONE actionable tip if spending seems high or volatile

TONE:
- Friendly and encouraging, not judgmental
- Use "you" and "your" to make it personal
- Be specific with numbers when helpful (use {currency} symbol)

FORMAT RULES:
- Return ONLY a valid JSON object
- No markdown, no code blocks, no extra text
- Keys = category names (exactly as provided)
- Values = insight strings (2-3 sentences max)
- Start with {{ and end with }}

EXAMPLES of good insights:
- "Your Food spending averages ₹8,500/month with a slight upward trend. This ₹9,350 budget gives you 10% breathing room. Consider meal prepping to stay within budget."
- "Entertainment spending is quite stable at ₹2,000/month. Your ₹2,200 budget is well-aligned with your habits."
- "Transport costs vary a lot month-to-month. The ₹5,500 buffer accounts for this volatility - useful for unexpected trips."

Generate insights now:`,
});

/**
 * Generate smart fallback explanations when LLM is disabled
 */
const generateSmartFallback = (inputs) => {
  const fallback = {};

  for (const b of inputs) {
    const trend = b.trend;
    const volatility = b.volatility ?? 0;
    const buffer = b.bufferPercent;
    const diff = b.suggestedBudget - b.avgMonthlySpend;
    const diffPercent = ((diff / b.avgMonthlySpend) * 100).toFixed(0);

    let message = "";

    if (volatility > 0.5) {
      message = `Your ${b.category} spending varies significantly month-to-month. This budget includes extra buffer to handle fluctuations.`;
    } else if (trend === "up") {
      message = `Your ${b.category} spending has been increasing recently. This budget of ₹${Math.round(b.suggestedBudget).toLocaleString()} accounts for the upward trend.`;
    } else if (trend === "down") {
      message = `Great news! Your ${b.category} spending is trending down. This optimized budget reflects your improving habits.`;
    } else {
      message = `Based on ${b.monthsAnalyzed} months of data, you typically spend around ₹${Math.round(b.avgMonthlySpend).toLocaleString()} on ${b.category}. This budget adds a ${buffer}% buffer for flexibility.`;
    }

    fallback[b.category] = message;
  }

  return fallback;
};

export const generateBudgetExplanationsBatch = async (inputs, currency = "INR") => {
  if (!LLM_ENABLED) {
    return generateSmartFallback(inputs);
  }

  const validated = validateBudgetExplanationBatch(inputs);

  const chain = batchExplanationPrompt.pipe(llm);

  // Enhanced payload with more context for the LLM
  const payload = JSON.stringify(
    validated.map((b) => ({
      category: b.category,
      avgMonthlySpend: Math.round(b.avgMonthlySpend),
      suggestedBudget: Math.round(b.suggestedBudget),
      bufferAmount: Math.round(b.suggestedBudget - b.avgMonthlySpend),
      trend: b.trend ?? "stable",
      volatility: b.volatility ? (b.volatility > 0.5 ? "high" : "low") : "normal",
      monthsAnalyzed: b.monthsAnalyzed,
      mlEnhanced: b.mlUsed,
    })),
    null,
    2
  );

  const currencySymbol = currency === "INR" ? "₹" : "$";

  try {
    const response = await chain.invoke({
      budgets: payload,
      currency: currencySymbol
    });

    // Clean response - remove any accidental markdown
    let content = response.content;
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "");
    content = content.trim();

    return JSON.parse(content);
  } catch (err) {
    console.error("Budget explanation generation failed:", err.message);
    // Return smart fallback on error
    return generateSmartFallback(inputs);
  }
};

/**
 * Generate a single holistic financial summary (optional - for dashboard)
 */
export const generateFinancialSummary = async (budgetData, totalIncome = null) => {
  if (!LLM_ENABLED) {
    return "Your budgets are set based on your recent spending patterns. Review each category for detailed insights.";
  }

  const summaryPrompt = new PromptTemplate({
    inputVariables: ["data", "income"],
    template: `You are a financial advisor giving a brief monthly summary.

DATA:
- Total budgeted: ₹{totalBudget}
- Categories: {categoryCount}
- Highest spend category: {topCategory} (₹{topAmount})
- Overall trend: {overallTrend}
{incomeContext}

Write a 2-3 sentence friendly summary of their financial situation this month. Be encouraging but honest. No JSON, just plain text.`,
  });

  const totalBudget = budgetData.reduce((sum, b) => sum + b.suggestedBudget, 0);
  const topCategory = budgetData.reduce((max, b) =>
    b.avgMonthlySpend > (max?.avgMonthlySpend || 0) ? b : max, null);

  const upTrends = budgetData.filter(b => b.trend === "up").length;
  const downTrends = budgetData.filter(b => b.trend === "down").length;
  const overallTrend = upTrends > downTrends ? "increasing" :
    downTrends > upTrends ? "decreasing" : "stable";

  const incomeContext = totalIncome
    ? `- Monthly income: ₹${totalIncome}\n- Savings potential: ₹${totalIncome - totalBudget}`
    : "";

  try {
    const chain = summaryPrompt.pipe(llm);
    const response = await chain.invoke({
      totalBudget: Math.round(totalBudget).toLocaleString(),
      categoryCount: budgetData.length,
      topCategory: topCategory?.category || "Unknown",
      topAmount: Math.round(topCategory?.avgMonthlySpend || 0).toLocaleString(),
      overallTrend,
      incomeContext,
    });

    return response.content;
  } catch (err) {
    console.error("Financial summary generation failed:", err);
    return "Your budgets are set based on your recent spending patterns.";
  }
};
