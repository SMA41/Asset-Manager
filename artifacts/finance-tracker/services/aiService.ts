import { Product, Sale, Expense, Budget } from "@/types";
import { formatCurrency, monthKey } from "@/utils/format";

const MODEL = "gemini-2.0-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

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

async function geminiCall(parts: Array<{ text: string }>, history?: ChatTurn[]): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_AI_API_KEY;
  if (!apiKey) throw new Error("AI key missing");

  const contents: any[] = [];
  if (history && history.length) {
    for (const t of history) {
      contents.push({
        role: t.role === "assistant" ? "model" : "user",
        parts: [{ text: t.content }],
      });
    }
  }
  contents.push({ role: "user", parts });

  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`AI request failed (${res.status}): ${errText.slice(0, 200)}`);
  }
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts
    ?.map((p: any) => p?.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("AI returned empty response");
  return text;
}

export async function generateReport(snapshot: FinanceSnapshot): Promise<string> {
  const system = `You are a friendly, plain-spoken financial advisor for a small business owner.
Analyze the data and respond with these clearly labeled sections, in order:

1. Snapshot — one sentence summarizing the month.
2. Profit & loss — a short paragraph on revenue, costs and net result.
3. Spending insights — what the expense categories reveal.
4. Performance — what stands out (top products, slow movers, stock).
5. Suggestions — 3 concrete, actionable recommendations as bullet points.

Keep it conversational, concise, and human-friendly. Avoid jargon. Do not use markdown headings (#) or asterisks. Use plain section names followed by a colon.`;

  const userPrompt = `${system}\n\nHere is the business data:\n\n${snapshotToText(snapshot)}`;
  return geminiCall([{ text: userPrompt }]);
}

export async function chatWithAI(args: {
  history: ChatTurn[];
  userMessage: string;
  snapshot: FinanceSnapshot;
}): Promise<string> {
  const system = `You are an AI accountant embedded in a small-business finance app.
You have access to the user's current finance snapshot below. Use it to answer questions about
revenue, expenses, profit, budget, products, and stock. Be concise (2-5 short sentences).
If asked something unrelated to the business data, gently redirect to financial topics.

CURRENT SNAPSHOT:
${snapshotToText(args.snapshot)}`;

  const seededHistory: ChatTurn[] = [
    { role: "user", content: system },
    {
      role: "assistant",
      content: "Got it. I'll use that snapshot when answering your questions.",
    },
    ...args.history,
  ];

  return geminiCall([{ text: args.userMessage }], seededHistory);
}
