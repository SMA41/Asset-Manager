import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppHeader } from "@/components/AppHeader";
import { BarChart, BarDatum } from "@/components/BarChart";
import { LineChart, LinePoint } from "@/components/LineChart";
import { SectionHeader } from "@/components/SectionHeader";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { PaywallCard } from "@/components/PaywallCard";
import { useData } from "@/contexts/DataContext";
import { usePlan } from "@/contexts/PlanContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency, monthKey } from "@/utils/format";

export default function AnalyticsScreen() {
  const c = useColors();
  const { isPro } = usePlan();
  const { sales, expenses, products } = useData();

  // Top selling products (all-time)
  const topProducts = useMemo(() => {
    const agg = new Map<string, { name: string; revenue: number; units: number; profit: number }>();
    for (const s of sales) {
      const cur = agg.get(s.productId) ?? { name: s.productName, revenue: 0, units: 0, profit: 0 };
      cur.revenue += s.revenue;
      cur.units += s.quantity;
      cur.profit += s.profit;
      agg.set(s.productId, cur);
    }
    return Array.from(agg.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [sales]);

  // Monthly trends (last 6 months)
  const monthlyTrends = useMemo(() => {
    const months: { key: string; label: string; revenue: number; profit: number; expenses: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      const label = d.toLocaleDateString(undefined, { month: "short" });
      months.push({ key, label, revenue: 0, profit: 0, expenses: 0 });
    }
    const byKey = new Map(months.map((m) => [m.key, m]));
    for (const s of sales) {
      const k = monthKey(new Date(s.date));
      const m = byKey.get(k);
      if (m) {
        m.revenue += s.revenue;
        m.profit += s.profit;
      }
    }
    for (const e of expenses) {
      const k = monthKey(new Date(e.date));
      const m = byKey.get(k);
      if (m) m.expenses += e.amount;
      const m2 = byKey.get(k);
      if (m2) m2.profit -= e.amount;
    }
    return months;
  }, [sales, expenses]);

  const revenueBars: BarDatum[] = monthlyTrends.map((m) => ({ label: m.label, value: m.revenue }));
  const profitLine: LinePoint[] = monthlyTrends.map((m) => ({ label: m.label, value: m.profit }));
  const expenseBars: BarDatum[] = monthlyTrends.map((m) => ({ label: m.label, value: m.expenses }));

  // Profit margin per product
  const margins = useMemo(() => {
    return products
      .map((p) => {
        const margin =
          p.sellingPrice > 0
            ? ((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100
            : 0;
        return { name: p.name, margin, sellingPrice: p.sellingPrice };
      })
      .filter((p) => p.name)
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 8);
  }, [products]);

  const totals = useMemo(() => {
    const totalRevenue = sales.reduce((a, s) => a + s.revenue, 0);
    const totalProfit = sales.reduce((a, s) => a + s.profit, 0) - expenses.reduce((a, e) => a + e.amount, 0);
    const totalUnits = sales.reduce((a, s) => a + s.quantity, 0);
    const avgOrder = sales.length > 0 ? totalRevenue / sales.length : 0;
    return { totalRevenue, totalProfit, totalUnits, avgOrder };
  }, [sales, expenses]);

  if (!isPro) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader title="Analytics" subtitle="Pro feature" rightIcon="x" onRightPress={() => router.back()} />
        <View style={{ padding: 20 }}>
          <PaywallCard
            feature="Advanced analytics"
            description="See top sellers, 6-month trends, profit margins per product and your average order value."
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader
        title="Analytics"
        subtitle="Deep dive into your numbers"
        rightIcon="arrow-left"
        onRightPress={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.row}>
          <StatCard
            label="Lifetime revenue"
            value={formatCurrency(totals.totalRevenue)}
            icon="trending-up"
            tone="positive"
            style={{ flex: 1 }}
          />
          <StatCard
            label="Lifetime profit"
            value={formatCurrency(totals.totalProfit)}
            icon="dollar-sign"
            tone={totals.totalProfit >= 0 ? "positive" : "negative"}
            style={{ flex: 1 }}
          />
        </View>
        <View style={styles.row}>
          <StatCard
            label="Units sold"
            value={String(totals.totalUnits)}
            icon="shopping-bag"
            style={{ flex: 1 }}
          />
          <StatCard
            label="Avg sale"
            value={formatCurrency(totals.avgOrder)}
            icon="bar-chart"
            style={{ flex: 1 }}
          />
        </View>

        <Card>
          <SectionHeader title="Revenue · last 6 months" subtitle={`Total ${formatCurrency(revenueBars.reduce((a, b) => a + b.value, 0))}`} />
          {revenueBars.some((d) => d.value > 0) ? (
            <BarChart data={revenueBars} formatValue={formatCurrency} />
          ) : (
            <Empty text="No sales recorded yet." />
          )}
        </Card>

        <Card>
          <SectionHeader title="Profit trend · 6 months" subtitle="Revenue minus costs and expenses" />
          {profitLine.some((d) => d.value !== 0) ? (
            <LineChart
              data={profitLine}
              formatValue={formatCurrency}
              positiveColor={c.success}
              negativeColor={c.danger}
            />
          ) : (
            <Empty text="No profit data yet." />
          )}
        </Card>

        <Card>
          <SectionHeader title="Expenses · 6 months" subtitle={`Total ${formatCurrency(expenseBars.reduce((a, b) => a + b.value, 0))}`} />
          {expenseBars.some((d) => d.value > 0) ? (
            <BarChart data={expenseBars} formatValue={formatCurrency} />
          ) : (
            <Empty text="No expenses logged." />
          )}
        </Card>

        <Card>
          <SectionHeader title="Top sellers" subtitle="By all-time revenue" />
          {topProducts.length === 0 ? (
            <EmptyState icon="award" title="No sales yet" message="Record sales to see your best products." />
          ) : (
            <View style={{ gap: 10 }}>
              {topProducts.map((p, i) => (
                <View key={`${p.name}-${i}`} style={styles.topRow}>
                  <View style={[styles.rank, { backgroundColor: c.accent }]}>
                    <Text style={[styles.rankText, { color: c.accentForeground }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 14 }} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12 }}>
                      {p.units} sold · profit {formatCurrency(p.profit)}
                    </Text>
                  </View>
                  <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                    {formatCurrency(p.revenue)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card>
          <SectionHeader title="Profit margins" subtitle="Per product, highest first" />
          {margins.length === 0 ? (
            <EmptyState icon="percent" title="No products yet" message="Add a product to see margins." />
          ) : (
            <View style={{ gap: 10 }}>
              {margins.map((m) => {
                const pct = Math.max(0, Math.min(100, m.margin));
                const tone = m.margin >= 40 ? c.success : m.margin >= 20 ? c.warning : c.danger;
                return (
                  <View key={m.name} style={{ gap: 6 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: c.foreground, fontFamily: "Inter_600SemiBold", fontSize: 13 }} numberOfLines={1}>
                        {m.name}
                      </Text>
                      <Text style={{ color: tone, fontFamily: "Inter_700Bold", fontSize: 13 }}>
                        {m.margin.toFixed(0)}%
                      </Text>
                    </View>
                    <View style={[styles.track, { backgroundColor: c.muted }]}>
                      <View style={{ width: `${pct}%`, height: "100%", backgroundColor: tone, borderRadius: 999 }} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
      ]}
    >
      {children}
    </View>
  );
}

function Empty({ text }: { text: string }) {
  const c = useColors();
  return (
    <View style={{ paddingVertical: 18, alignItems: "center" }}>
      <Feather name="bar-chart-2" size={20} color={c.mutedForeground} />
      <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 6 }}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 80, gap: 14 },
  row: { flexDirection: "row", gap: 12 },
  card: { padding: 16, borderWidth: 1, gap: 4 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  track: { height: 8, borderRadius: 999, overflow: "hidden" },
});
