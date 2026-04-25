import { Product, Sale, Expense, Budget } from "@/types";
import { formatCurrency, monthKey } from "@/utils/format";

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

function endpointFor(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

function cleanResponse(text: string): string {
  return text
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|[^*])\*(?!\*)([^*\n]+)\*(?!\*)/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type ChatTurn = { role: "user" | "assistant"; content: string };

export type FinanceSnapshot = {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  cogs: number;
  grossProfit: number;
  productsCount: number;
  lowStockCount: number;
  topProducts: Array<{ name: string; revenue: number; units: number }>;
  expensesByCategory: Array<{ category: string; amount: number }>;
  budget?: number | null;
  budgetUsedPct?: number | null;
};

export function buildSnapshot(args: {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  budgets: Budget[];
  month?: string;
}): FinanceSnapshot {
  const month = args.month ?? monthKey(new Date());
  const inMonth = (ts: number) => monthKey(new Date(ts)) === month;

  const monthSales = args.sales.filter((s) => inMonth(s.date));
  const monthExpenses = args.expenses.filter((e) => inMonth(e.date));

  const revenue = monthSales.reduce((a, s) => a + s.revenue, 0);
  const cogs = monthSales.reduce((a, s) => a + s.unitCost * s.quantity, 0);
  const grossProfit = revenue - cogs;
  const expensesTotal = monthExpenses.reduce((a, e) => a + e.amount, 0);
  const profit = grossProfit - expensesTotal;

  const productAgg = new Map<string, { revenue: number; units: number; name: string }>();
  for (const s of monthSales) {
    const cur = productAgg.get(s.productId) ?? { revenue: 0, units: 0, name: s.productName };
    cur.revenue += s.revenue;
    cur.units += s.quantity;
    productAgg.set(s.productId, cur);
  }
  const topProducts = Array.from(productAgg.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((p) => ({ name: p.name, revenue: p.revenue, units: p.units }));

  const catAgg = new Map<string, number>();
  for (const e of monthExpenses) {
    catAgg.set(e.category, (catAgg.get(e.category) ?? 0) + e.amount);
  }
  const expensesByCategory = Array.from(catAgg.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({ category, amount }));

  const budget = args.budgets.find((b) => b.month === month);
  const budgetUsedPct = budget && budget.amount > 0
    ? (expensesTotal / budget.amount) * 100
    : null;

  const lowStockCount = args.products.filter((p) => p.stock <= 5).length;

  return {
    period: month,
    revenue,
    expenses: expensesTotal,
    profit,
    cogs,
    grossProfit,
    productsCount: args.products.length,
    lowStockCount,
    topProducts,
    expensesByCategory,
    budget: budget?.amount ?? null,
    budgetUsedPct,
  };
}

function snapshotToText(s: FinanceSnapshot): string {
  const lines = [
    `Period: ${s.period}`,
    `Revenue: ${formatCurrency(s.revenue)}`,
    `Cost of goods sold: ${formatCurrency(s.cogs)}`,
    `Gross profit: ${formatCurrency(s.grossProfit)}`,
    `Operating expenses: ${formatCurrency(s.expenses)}`,
    `Net profit/loss: ${formatCurrency(s.profit)}`,
    `Products in catalog: ${s.productsCount}`,
    `Low-stock products (<=5): ${s.lowStockCount}`,
  ];
  if (s.budget != null) {
    lines.push(
      `Monthly expense budget: ${formatCurrency(s.budget)} (${(s.budgetUsedPct ?? 0).toFixed(0)}% used)`
    );
  }
  if (s.topProducts.length) {
    lines.push("Top products:");
    for (const p of s.topProducts) {
      lines.push(` - ${p.name}: ${formatCurrency(p.revenue)} from ${p.units} units`);
    }
  }
  if (s.expensesByCategory.length) {
    lines.push("Expenses by category:");
    for (const c of s.expensesByCategory) {
      lines.push(` - ${c.category}: ${formatCurrency(c.amount)}`);
    }
  }
  return lines.join("\n");
}

async function geminiCall(
  prompt: string,
  history?: ChatTurn[],
  systemInstruction?: string
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_AI_API_KEY;
  if (!apiKey) {
    throw new Error("AI key missing. Set EXPO_PUBLIC_AI_API_KEY in your environment.");
  }

  const contents: any[] = [];
  if (history && history.length) {
    for (const t of history) {
      const text = (t.content ?? "").trim();
      if (!text) continue;
      contents.push({
        role: t.role === "assistant" ? "model" : "user",
        parts: [{ text }],
      });
    }
  }
  contents.push({ role: "user", parts: [{ text: prompt }] });

  const body: any = {
    contents,
    generationConfig: {
      temperature: 0.6,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  };
  if (systemInstruction) {
    body.systemInstruction = { role: "system", parts: [{ text: systemInstruction }] };
  }

  let lastErr: any = null;
  for (const model of MODELS) {
    try {
      const res = await fetch(`${endpointFor(model)}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        if (res.status === 404 || res.status === 400) {
          lastErr = new Error(`Model ${model} unavailable (${res.status})`);
          continue;
        }
        throw new Error(prettyAIError(res.status, errText));
      }

      const json = await res.json();
      const candidate = json?.candidates?.[0];
      const finishReason = candidate?.finishReason;
      const text = candidate?.content?.parts
        ?.map((p: any) => p?.text ?? "")
        .join("")
        .trim();

      if (!text) {
        if (finishReason === "SAFETY") {
          throw new Error("That topic was blocked by the AI safety filter. Try rephrasing.");
        }
        if (finishReason === "MAX_TOKENS") {
          throw new Error("The reply was too long. Try a more focused question.");
        }
        throw new Error("The AI returned an empty response. Please try again.");
      }
      return cleanResponse(text);
    } catch (err: any) {
      lastErr = err;
      const msg = err?.message ?? "";
      if (msg.includes("unavailable")) continue;
      throw err;
    }
  }
  throw lastErr ?? new Error("AI request failed");
}

function prettyAIError(status: number, body: string): string {
  if (status === 401 || status === 403) {
    return "AI key was rejected. Double-check EXPO_PUBLIC_AI_API_KEY.";
  }
  if (status === 429) {
    return "AI quota reached. Wait a moment and try again.";
  }
  if (status >= 500) {
    return "AI service is having trouble. Please try again in a few seconds.";
  }
  try {
    const parsed = JSON.parse(body);
    const m = parsed?.error?.message;
    if (m) return m;
  } catch {}
  return `AI request failed (${status}).`;
}

export async function generateReport(snapshot: FinanceSnapshot): Promise<string> {
  const system = `You are a friendly, plain-spoken financial advisor for a small business owner.
Write the report in plain text only. Do NOT use markdown — no asterisks, no hashes, no backticks, no bold formatting.
Use these exact labeled sections in order, each starting with the label on its own line followed by a colon:

Snapshot:
Profit and loss:
Spending insights:
Performance:
Suggestions:

Under "Suggestions:", list 3 short bullets prefixed with "• ".
Keep the whole report under 250 words. Be conversational, specific to the numbers, and avoid jargon.`;

  const prompt = `Here is this month's data:\n\n${snapshotToText(snapshot)}\n\nWrite the report now.`;
  return geminiCall(prompt, undefined, system);
}

export async function chatWithAI(args: {
  history: ChatTurn[];
  userMessage: string;
  snapshot: FinanceSnapshot;
}): Promise<string> {
  const system = `You are an AI accountant inside a small-business finance app.
You have a live snapshot of the user's finances below. Use the actual numbers in your answers.
Reply in plain text only — no markdown, no asterisks, no headings.
Keep replies short and warm: 2 to 5 sentences unless the user asks for a list.

LIVE SNAPSHOT:
${snapshotToText(args.snapshot)}`;

  return geminiCall(args.userMessage, args.history, system);
}
