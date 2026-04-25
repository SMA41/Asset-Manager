import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  runTransaction,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Product,
  Sale,
  Expense,
  Budget,
  AIReport,
  ChatMessage,
} from "@/types";

function userCol(userId: string, name: string) {
  return collection(db, "users", userId, name);
}

function userDoc(userId: string, name: string, id: string) {
  return doc(db, "users", userId, name, id);
}

// ===== Products =====
export function subscribeProducts(
  userId: string,
  cb: (items: Product[]) => void
): Unsubscribe {
  const q = query(userCol(userId, "products"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const items: Product[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name ?? "",
        costPrice: Number(data.costPrice ?? 0),
        sellingPrice: Number(data.sellingPrice ?? 0),
        stock: Number(data.stock ?? 0),
        createdAt: tsToMillis(data.createdAt),
      };
    });
    cb(items);
  });
}

export async function createProduct(
  userId: string,
  data: Omit<Product, "id" | "createdAt">
) {
  await addDoc(userCol(userId, "products"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateProduct(
  userId: string,
  id: string,
  data: Partial<Omit<Product, "id" | "createdAt">>
) {
  await updateDoc(userDoc(userId, "products", id), data as any);
}

export async function deleteProduct(userId: string, id: string) {
  await deleteDoc(userDoc(userId, "products", id));
}

// ===== Sales =====
export function subscribeSales(
  userId: string,
  cb: (items: Sale[]) => void
): Unsubscribe {
  const q = query(userCol(userId, "sales"), orderBy("date", "desc"));
  return onSnapshot(q, (snap) => {
    const items: Sale[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        productId: data.productId ?? "",
        productName: data.productName ?? "",
        quantity: Number(data.quantity ?? 0),
        unitPrice: Number(data.unitPrice ?? 0),
        unitCost: Number(data.unitCost ?? 0),
        revenue: Number(data.revenue ?? 0),
        profit: Number(data.profit ?? 0),
        date: tsToMillis(data.date),
      };
    });
    cb(items);
  });
}

export async function recordSale(
  userId: string,
  args: {
    productId: string;
    quantity: number;
  }
) {
  const productRef = userDoc(userId, "products", args.productId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(productRef);
    if (!snap.exists()) throw new Error("Product not found");
    const data = snap.data();
    const stock = Number(data.stock ?? 0);
    if (stock < args.quantity) {
      throw new Error("Not enough stock");
    }
    const sellingPrice = Number(data.sellingPrice ?? 0);
    const costPrice = Number(data.costPrice ?? 0);
    const revenue = sellingPrice * args.quantity;
    const cost = costPrice * args.quantity;
    const profit = revenue - cost;

    tx.update(productRef, { stock: stock - args.quantity });
    const saleRef = doc(userCol(userId, "sales"));
    tx.set(saleRef, {
      productId: args.productId,
      productName: data.name ?? "",
      quantity: args.quantity,
      unitPrice: sellingPrice,
      unitCost: costPrice,
      revenue,
      profit,
      date: serverTimestamp(),
    });
  });
}

export async function deleteSale(userId: string, id: string) {
  await deleteDoc(userDoc(userId, "sales", id));
}

// ===== Expenses =====
export function subscribeExpenses(
  userId: string,
  cb: (items: Expense[]) => void
): Unsubscribe {
  const q = query(userCol(userId, "expenses"), orderBy("date", "desc"));
  return onSnapshot(q, (snap) => {
    const items: Expense[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title ?? "",
        amount: Number(data.amount ?? 0),
        category: data.category ?? "Other",
        note: data.note ?? "",
        date: tsToMillis(data.date),
      };
    });
    cb(items);
  });
}

export async function createExpense(
  userId: string,
  data: Omit<Expense, "id" | "date"> & { date?: number }
) {
  await addDoc(userCol(userId, "expenses"), {
    ...data,
    date: data.date ? Timestamp.fromMillis(data.date) : serverTimestamp(),
  });
}

export async function deleteExpense(userId: string, id: string) {
  await deleteDoc(userDoc(userId, "expenses", id));
}

// ===== Budgets =====
export function subscribeBudgets(
  userId: string,
  cb: (items: Budget[]) => void
): Unsubscribe {
  const q = query(userCol(userId, "budgets"), orderBy("month", "desc"));
  return onSnapshot(q, (snap) => {
    const items: Budget[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        month: data.month ?? "",
        amount: Number(data.amount ?? 0),
      };
    });
    cb(items);
  });
}

export async function setMonthlyBudget(
  userId: string,
  month: string,
  amount: number
) {
  const ref = userDoc(userId, "budgets", month);
  await setDoc(ref, { month, amount });
}

// ===== AI Reports =====
export function subscribeReports(
  userId: string,
  cb: (items: AIReport[]) => void
): Unsubscribe {
  const q = query(userCol(userId, "ai_reports"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const items: AIReport[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        summary: data.summary ?? "",
        createdAt: tsToMillis(data.createdAt),
        period: data.period ?? "",
        snapshot: data.snapshot ?? null,
      };
    });
    cb(items);
  });
}

export async function saveReport(
  userId: string,
  args: { summary: string; period: string; snapshot: any }
) {
  await addDoc(userCol(userId, "ai_reports"), {
    summary: args.summary,
    period: args.period,
    snapshot: args.snapshot,
    createdAt: serverTimestamp(),
  });
}

export async function deleteReport(userId: string, id: string) {
  await deleteDoc(userDoc(userId, "ai_reports", id));
}

// ===== AI Chat =====
export function subscribeChat(
  userId: string,
  cb: (items: ChatMessage[]) => void
): Unsubscribe {
  const q = query(userCol(userId, "ai_chat"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const items: ChatMessage[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        role: (data.role as "user" | "assistant") ?? "user",
        content: data.content ?? "",
        createdAt: tsToMillis(data.createdAt),
      };
    });
    cb(items);
  });
}

export async function appendChat(
  userId: string,
  msg: { role: "user" | "assistant"; content: string }
) {
  await addDoc(userCol(userId, "ai_chat"), {
    ...msg,
    createdAt: serverTimestamp(),
  });
}

export async function clearChat(userId: string, ids: string[]) {
  const batch = writeBatch(db);
  ids.forEach((id) => batch.delete(userDoc(userId, "ai_chat", id)));
  await batch.commit();
}

// ===== helpers =====
function tsToMillis(v: any): number {
  if (!v) return Date.now();
  if (v instanceof Timestamp) return v.toMillis();
  if (typeof v?.toMillis === "function") return v.toMillis();
  if (typeof v === "number") return v;
  return Date.now();
}
