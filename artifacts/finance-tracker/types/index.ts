export type Product = {
  id: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  createdAt: number;
};

export type Sale = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  revenue: number;
  profit: number;
  date: number;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  note?: string;
  date: number;
};

export type Budget = {
  id: string;
  month: string;
  amount: number;
};

export type AIReport = {
  id: string;
  summary: string;
  period: string;
  createdAt: number;
  snapshot: any;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};
