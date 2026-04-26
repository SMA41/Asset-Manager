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

export type Plan = "free" | "pro";

export type UserProfile = {
  plan: Plan;
  upgradedAt?: number | null;
  businessName?: string;
};

export type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: number;
};

export type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export type Invoice = {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  issueDate: number;
  dueDate: number;
  paidAt?: number | null;
  notes?: string;
  createdAt: number;
};
