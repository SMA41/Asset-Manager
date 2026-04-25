export const EXPENSE_CATEGORIES = [
  "Inventory",
  "Rent",
  "Utilities",
  "Marketing",
  "Salaries",
  "Shipping",
  "Software",
  "Travel",
  "Taxes",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_ICONS: Record<string, string> = {
  Inventory: "package",
  Rent: "home",
  Utilities: "zap",
  Marketing: "trending-up",
  Salaries: "users",
  Shipping: "truck",
  Software: "monitor",
  Travel: "map",
  Taxes: "file-text",
  Other: "more-horizontal",
};
