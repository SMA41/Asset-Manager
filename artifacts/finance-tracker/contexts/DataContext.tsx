import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  subscribeProducts,
  subscribeSales,
  subscribeExpenses,
  subscribeBudgets,
  subscribeReports,
  subscribeCustomers,
  subscribeInvoices,
} from "@/services/firebaseService";
import { Product, Sale, Expense, Budget, AIReport, Customer, Invoice } from "@/types";
import { useAuth } from "./AuthContext";

type DataContextValue = {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  budgets: Budget[];
  reports: AIReport[];
  customers: Customer[];
  invoices: Invoice[];
  loading: boolean;
};

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [reports, setReports] = useState<AIReport[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setSales([]);
      setExpenses([]);
      setBudgets([]);
      setReports([]);
      setCustomers([]);
      setInvoices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let resolved = 0;
    const total = 7;
    const onResolved = () => {
      resolved += 1;
      if (resolved >= total) setLoading(false);
    };

    const u1 = subscribeProducts(user.uid, (v) => {
      setProducts(v);
      onResolved();
    });
    const u2 = subscribeSales(user.uid, (v) => {
      setSales(v);
      onResolved();
    });
    const u3 = subscribeExpenses(user.uid, (v) => {
      setExpenses(v);
      onResolved();
    });
    const u4 = subscribeBudgets(user.uid, (v) => {
      setBudgets(v);
      onResolved();
    });
    const u5 = subscribeReports(user.uid, (v) => {
      setReports(v);
      onResolved();
    });
    const u6 = subscribeCustomers(user.uid, (v) => {
      setCustomers(v);
      onResolved();
    });
    const u7 = subscribeInvoices(user.uid, (v) => {
      setInvoices(v);
      onResolved();
    });

    return () => {
      u1();
      u2();
      u3();
      u4();
      u5();
      u6();
      u7();
    };
  }, [user]);

  const value = useMemo(
    () => ({ products, sales, expenses, budgets, reports, customers, invoices, loading }),
    [products, sales, expenses, budgets, reports, customers, invoices, loading]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
