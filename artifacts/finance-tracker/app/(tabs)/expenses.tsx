import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { StatCard } from "@/components/StatCard";
import { BarChart, BarDatum } from "@/components/BarChart";
import { SectionHeader } from "@/components/SectionHeader";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { deleteExpense } from "@/services/firebaseService";
import { confirm } from "@/utils/confirm";
import { buildCsv, exportCsv } from "@/utils/exportCsv";
import { formatCurrency, formatDate, monthKey, monthLabel } from "@/utils/format";
import { CATEGORY_ICONS } from "@/constants/categories";
import { Expense } from "@/types";

export default function ExpensesScreen() {
  const c = useColors();
  const { expenses, budgets } = useData();
  const { user } = useAuth();

  const months = useMemo(() => {
    const set = new Set<string>();
    set.add(monthKey(new Date()));
    expenses.forEach((e) => set.add(monthKey(new Date(e.date))));
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const [activeMonth, setActiveMonth] = useState<string>(monthKey(new Date()));

  const filtered = useMemo(
    () => expenses.filter((e) => monthKey(new Date(e.date)) === activeMonth),
    [expenses, activeMonth]
  );
  const total = filtered.reduce((a, e) => a + e.amount, 0);
  const budget = budgets.find((b) => b.month === activeMonth)?.amount ?? null;

  const last14 = useMemo<BarDatum[]>(() => {
    const days: BarDatum[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const start = d.getTime();
      const end = start + 24 * 60 * 60 * 1000;
      const v = expenses
        .filter((e) => e.date >= start && e.date < end)
        .reduce((a, e) => a + e.amount, 0);
      days.push({
        label: String(d.getDate()),
        value: v,
      });
    }
    return days;
  }, [expenses]);

  const onDelete = async (e: Expense) => {
    const ok = await confirm({
      title: "Delete expense",
      message: `Remove ${e.title}?`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok || !user) return;
    try {
      await deleteExpense(user.uid, e.id);
    } catch (err: any) {
      Alert.alert("Couldn't delete", err?.message ?? "Please try again.");
    }
  };

  const onExport = async () => {
    if (filtered.length === 0) {
      Alert.alert("Nothing to export", "No expenses for this month.");
      return;
    }
    try {
      const csv = buildCsv(filtered, [
        { header: "Date", get: (e) => new Date(e.date).toISOString() },
        { header: "Title", get: (e) => e.title },
        { header: "Category", get: (e) => e.category },
        { header: "Amount", get: (e) => e.amount.toFixed(2) },
        { header: "Note", get: (e) => e.note ?? "" },
      ]);
      await exportCsv(`expenses-${activeMonth}.csv`, csv);
    } catch (err: any) {
      Alert.alert("Export failed", err?.message ?? "Please try again.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <AppHeader
        title="Expenses"
        subtitle="Track every dollar going out"
        rightIcon="plus"
        rightLabel="New"
        onRightPress={() => router.push("/expense/new")}
        secondaryIcon="download"
        onSecondaryPress={onExport}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {months.map((m) => {
          const active = m === activeMonth;
          return (
            <Pressable
              key={m}
              onPress={() => setActiveMonth(m)}
              style={({ pressed }) => [
                styles.tab,
                {
                  backgroundColor: active ? c.foreground : c.card,
                  borderColor: active ? c.foreground : c.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: active ? c.background : c.foreground },
                ]}
              >
                {monthLabel(m)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 16 }}>
            <View style={styles.statsRow}>
              <StatCard
                label="Spent"
                value={formatCurrency(total)}
                icon="arrow-down-right"
                tone="negative"
                style={{ flex: 1 }}
              />
              <StatCard
                label="Budget"
                value={budget != null ? formatCurrency(budget) : "—"}
                icon="target"
                tone={
                  budget != null && total > budget
                    ? "negative"
                    : budget != null && total > budget * 0.8
                    ? "warning"
                    : "default"
                }
                style={{ flex: 1 }}
              />
            </View>
            {budget != null && total > budget && (
              <View style={[styles.warning, { backgroundColor: `${c.danger}15`, borderColor: c.danger }]}>
                <Feather name="alert-circle" size={16} color={c.danger} />
                <Text style={{ color: c.danger, fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 }}>
                  You're {formatCurrency(total - budget)} over budget for {monthLabel(activeMonth)}.
                </Text>
              </View>
            )}
            <View
              style={[
                styles.card,
                { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
              ]}
            >
              <SectionHeader
                title="Spending · last 14 days"
                subtitle={`Total ${formatCurrency(last14.reduce((a, b) => a + b.value, 0))}`}
              />
              {last14.some((d) => d.value > 0) ? (
                <BarChart data={last14} formatValue={formatCurrency} height={140} />
              ) : (
                <View style={{ paddingVertical: 16 }}>
                  <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", textAlign: "center" }}>
                    No expenses in the last two weeks.
                  </Text>
                </View>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="credit-card"
            title="No expenses this month"
            message="Log a business expense to keep your books accurate."
            action={
              <Button
                label="Add expense"
                icon="plus"
                onPress={() => router.push("/expense/new")}
              />
            }
          />
        }
        renderItem={({ item }) => {
          const iconName = (CATEGORY_ICONS[item.category] ?? "tag") as keyof typeof Feather.glyphMap;
          return (
            <Pressable
              onLongPress={() => onDelete(item)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: c.card,
                  borderColor: c.border,
                  borderRadius: c.radius,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={[styles.icon, { backgroundColor: c.accent }]}>
                <Feather name={iconName} size={18} color={c.accentForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: c.foreground }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.meta, { color: c.mutedForeground }]}>
                  {item.category} · {formatDate(item.date)}
                </Text>
              </View>
              <Text style={[styles.amount, { color: c.foreground }]}>
                −{formatCurrency(item.amount)}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  list: { padding: 20, paddingTop: 4, paddingBottom: 140, flexGrow: 1 },
  statsRow: { flexDirection: "row", gap: 12 },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  meta: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 },
  amount: { fontFamily: "Inter_700Bold", fontSize: 15 },
  card: {
    padding: 16,
    borderWidth: 1,
    gap: 4,
  },
});
