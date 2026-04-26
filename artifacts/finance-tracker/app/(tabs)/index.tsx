import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppHeader } from "@/components/AppHeader";
import { StatCard } from "@/components/StatCard";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { BarChart, BarDatum } from "@/components/BarChart";
import { LineChart, LinePoint } from "@/components/LineChart";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { ProBadge } from "@/components/ProBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { usePlan } from "@/contexts/PlanContext";
import { useColors } from "@/hooks/useColors";
import { buildSnapshot } from "@/services/aiService";
import { formatCurrency, monthKey, monthLabel } from "@/utils/format";

export default function DashboardScreen() {
  const c = useColors();
  const { user } = useAuth();
  const { isPro } = usePlan();
  const { products, sales, expenses, budgets, invoices, loading } = useData();
  const [refreshing, setRefreshing] = useState(false);

  const snap = useMemo(
    () => buildSnapshot({ products, sales, expenses, budgets }),
    [products, sales, expenses, budgets]
  );

  const { last7Revenue, last7Profit } = useMemo(() => {
    const rev: BarDatum[] = [];
    const prof: LinePoint[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const start = d.getTime();
      const end = start + 24 * 60 * 60 * 1000;
      const daySales = sales.filter((s) => s.date >= start && s.date < end);
      const dayRev = daySales.reduce((a, s) => a + s.revenue, 0);
      const dayCogs = daySales.reduce((a, s) => a + (s.unitCost ?? 0) * (s.quantity ?? 0), 0);
      const dayExp = expenses
        .filter((e) => e.date >= start && e.date < end)
        .reduce((a, e) => a + e.amount, 0);
      const label = d.toLocaleDateString(undefined, { weekday: "narrow" });
      rev.push({ label, value: dayRev });
      prof.push({ label, value: dayRev - dayCogs - dayExp });
    }
    return { last7Revenue: rev, last7Profit: prof };
  }, [sales, expenses]);

  // Pro-only: advanced widgets data
  const proWidgets = useMemo(() => {
    // Top sellers all-time
    const agg = new Map<string, { name: string; revenue: number; units: number }>();
    for (const s of sales) {
      const cur = agg.get(s.productId) ?? { name: s.productName, revenue: 0, units: 0 };
      cur.revenue += s.revenue;
      cur.units += s.quantity;
      agg.set(s.productId, cur);
    }
    const topSellers = Array.from(agg.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 3);

    // Best margins
    const margins = products
      .map((p) => ({
        name: p.name,
        margin: p.sellingPrice > 0 ? ((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100 : 0,
      }))
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 3);

    // Outstanding invoices
    const outstanding = invoices
      .filter((i) => i.status !== "paid")
      .reduce((a, i) => a + i.total, 0);
    const overdueCount = invoices.filter((i) => i.status !== "paid" && i.dueDate < Date.now()).length;

    return { topSellers, margins, outstanding, overdueCount };
  }, [sales, products, invoices]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const profitTone = snap.profit >= 0 ? "positive" : "negative";

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <AppHeader
        title={user?.displayName || user?.email?.split("@")[0] || "Dashboard"}
        subtitle={`${greeting} — ${monthLabel(monthKey(new Date()))}`}
        rightIcon="message-circle"
        onRightPress={() => router.push("/assistant")}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
        }
      >
        {/* Hero card */}
        <View
          style={[
            styles.hero,
            {
              backgroundColor: c.foreground,
              borderRadius: c.radius + 4,
            },
          ]}
        >
          <Text style={[styles.heroLabel, { color: c.background }]}>Net profit this month</Text>
          <Text style={[styles.heroValue, { color: c.background }]}>
            {formatCurrency(snap.profit)}
          </Text>
          <View style={styles.heroRow}>
            <View style={styles.heroItem}>
              <View style={[styles.dot, { backgroundColor: c.success }]} />
              <Text style={[styles.heroSubLabel, { color: c.background }]}>Revenue</Text>
              <Text style={[styles.heroSubValue, { color: c.background }]}>
                {formatCurrency(snap.revenue)}
              </Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroItem}>
              <View style={[styles.dot, { backgroundColor: c.danger }]} />
              <Text style={[styles.heroSubLabel, { color: c.background }]}>Expenses</Text>
              <Text style={[styles.heroSubValue, { color: c.background }]}>
                {formatCurrency(snap.expenses + snap.cogs)}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.grid}>
          <StatCard
            label="Gross profit"
            value={formatCurrency(snap.grossProfit)}
            icon="trending-up"
            tone={snap.grossProfit >= 0 ? "positive" : "negative"}
            style={{ flex: 1 }}
          />
          <StatCard
            label="Margin"
            value={
              snap.revenue > 0
                ? `${((snap.grossProfit / snap.revenue) * 100).toFixed(1)}%`
                : "—"
            }
            icon="percent"
            tone={profitTone}
            style={{ flex: 1 }}
          />
        </View>
        <View style={styles.grid}>
          <StatCard
            label="Products"
            value={String(snap.productsCount)}
            icon="package"
            style={{ flex: 1 }}
          />
          <StatCard
            label="Low stock"
            value={String(snap.lowStockCount)}
            icon="alert-triangle"
            tone={snap.lowStockCount > 0 ? "warning" : "default"}
            style={{ flex: 1 }}
          />
        </View>

        {/* Revenue chart */}
        <View
          style={[
            styles.card,
            { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
          ]}
        >
          <SectionHeader
            title="Revenue · last 7 days"
            subtitle={`Total ${formatCurrency(last7Revenue.reduce((a, b) => a + b.value, 0))}`}
          />
          {last7Revenue.some((d) => d.value > 0) ? (
            <BarChart data={last7Revenue} formatValue={formatCurrency} />
          ) : (
            <View style={{ paddingVertical: 24 }}>
              <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", textAlign: "center" }}>
                No sales in the last week yet.
              </Text>
            </View>
          )}
        </View>

        {/* Profit trend chart */}
        <View
          style={[
            styles.card,
            { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
          ]}
        >
          <SectionHeader
            title="Profit trend · last 7 days"
            subtitle={`Net ${formatCurrency(last7Profit.reduce((a, b) => a + b.value, 0))}`}
          />
          {last7Profit.some((d) => d.value !== 0) ? (
            <LineChart
              data={last7Profit}
              formatValue={formatCurrency}
              positiveColor={c.success}
              negativeColor={c.danger}
            />
          ) : (
            <View style={{ paddingVertical: 24 }}>
              <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", textAlign: "center" }}>
                Log a sale or expense to see your profit trend.
              </Text>
            </View>
          )}
        </View>

        {/* Pro insights teaser / panel */}
        {isPro ? (
          <View
            style={[
              styles.card,
              { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <SectionHeader
                title="Pro insights"
                subtitle="Top sellers, margins and pending money"
                actionLabel="More"
                actionIcon="arrow-right"
                onAction={() => router.push("/analytics")}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <StatCard
                label="Outstanding"
                value={formatCurrency(proWidgets.outstanding)}
                icon="clock"
                tone={proWidgets.outstanding > 0 ? "warning" : "default"}
                style={{ flex: 1 }}
              />
              <StatCard
                label="Overdue"
                value={String(proWidgets.overdueCount)}
                icon="alert-triangle"
                tone={proWidgets.overdueCount > 0 ? "negative" : "default"}
                style={{ flex: 1 }}
              />
            </View>

            <Text style={[styles.miniHeading, { color: c.mutedForeground }]}>TOP SELLERS</Text>
            {proWidgets.topSellers.length === 0 ? (
              <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12, paddingVertical: 8 }}>
                Record sales to see your bestsellers.
              </Text>
            ) : (
              <View style={{ gap: 8, marginBottom: 12 }}>
                {proWidgets.topSellers.map((p, i) => (
                  <View key={i} style={styles.miniRow}>
                    <Text style={{ color: c.foreground, fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 }} numberOfLines={1}>
                      {i + 1}. {p.name}
                    </Text>
                    <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12 }}>
                      {p.units} sold
                    </Text>
                    <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 13, marginLeft: 12 }}>
                      {formatCurrency(p.revenue)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={[styles.miniHeading, { color: c.mutedForeground }]}>BEST MARGINS</Text>
            {proWidgets.margins.length === 0 ? (
              <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12, paddingVertical: 8 }}>
                Add products to see margins.
              </Text>
            ) : (
              <View style={{ gap: 8 }}>
                {proWidgets.margins.map((m, i) => {
                  const tone = m.margin >= 40 ? c.success : m.margin >= 20 ? c.warning : c.danger;
                  return (
                    <View key={i} style={styles.miniRow}>
                      <Text style={{ color: c.foreground, fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 }} numberOfLines={1}>
                        {m.name}
                      </Text>
                      <Text style={{ color: tone, fontFamily: "Inter_700Bold", fontSize: 13 }}>
                        {m.margin.toFixed(0)}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <Pressable onPress={() => router.push("/upgrade")}>
            <View
              style={[
                styles.proTeaser,
                { backgroundColor: c.foreground, borderRadius: c.radius + 4 },
              ]}
            >
              <ProBadge size="md" />
              <Text style={{ color: c.background, fontFamily: "Inter_700Bold", fontSize: 18, marginTop: 10, letterSpacing: -0.3 }}>
                Unlock advanced insights
              </Text>
              <Text style={{ color: c.background, opacity: 0.7, fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 4, lineHeight: 16 }}>
                Customers, invoices, top sellers, profit margins, AI restock advice and bulk import.
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, gap: 6 }}>
                <Text style={{ color: c.background, fontFamily: "Inter_700Bold", fontSize: 13 }}>
                  See Pro features
                </Text>
                <Feather name="arrow-right" size={14} color={c.background} />
              </View>
            </View>
          </Pressable>
        )}

        {/* Budget */}
        <Pressable onPress={() => router.push("/budget")}>
          <View
            style={[
              styles.card,
              { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
            ]}
          >
            <SectionHeader
              title="Monthly budget"
              subtitle={
                snap.budget != null
                  ? `${formatCurrency(snap.expenses)} of ${formatCurrency(snap.budget)} spent`
                  : "Tap to set a budget for this month"
              }
              actionLabel="Edit"
              actionIcon="edit-2"
              onAction={() => router.push("/budget")}
            />
            {snap.budget != null ? (
              <View style={styles.progressWrap}>
                <View style={[styles.progressTrack, { backgroundColor: c.muted }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, snap.budgetUsedPct ?? 0)}%`,
                        backgroundColor:
                          (snap.budgetUsedPct ?? 0) > 100
                            ? c.danger
                            : (snap.budgetUsedPct ?? 0) > 80
                            ? c.warning
                            : c.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12 }}>
                  {(snap.budgetUsedPct ?? 0) > 100
                    ? `Over by ${formatCurrency(snap.expenses - snap.budget)}`
                    : `${formatCurrency(snap.budget - snap.expenses)} remaining`}
                </Text>
              </View>
            ) : (
              <View style={{ paddingVertical: 8 }}>
                <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium" }}>
                  Set a target so the AI can flag overspending.
                </Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* Categories */}
        <View
          style={[
            styles.card,
            { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
          ]}
        >
          <SectionHeader title="Where your money went" />
          {snap.expensesByCategory.length ? (
            <CategoryBreakdown items={snap.expensesByCategory} />
          ) : (
            <EmptyState
              icon="pie-chart"
              title="No expenses yet"
              message="Log your first expense to see a category breakdown."
            />
          )}
        </View>

        {/* Top products */}
        <View
          style={[
            styles.card,
            { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
          ]}
        >
          <SectionHeader title="Top performers" subtitle="By revenue this month" />
          {snap.topProducts.length === 0 ? (
            <EmptyState
              icon="award"
              title="No sales yet"
              message="Record a sale to see your best-selling products."
            />
          ) : (
            <View style={{ gap: 12 }}>
              {snap.topProducts.map((p, i) => (
                <View key={`${p.name}-${i}`} style={styles.topRow}>
                  <View style={[styles.rank, { backgroundColor: c.accent }]}>
                    <Text style={[styles.rankText, { color: c.accentForeground }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.topName, { color: c.foreground }]} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={[styles.topMeta, { color: c.mutedForeground }]}>
                      {p.units} sold
                    </Text>
                  </View>
                  <Text style={[styles.topAmount, { color: c.foreground }]}>
                    {formatCurrency(p.revenue)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick actions */}
        <View style={styles.actions}>
          <QuickAction
            label="Sale"
            icon="shopping-cart"
            onPress={() => router.push("/sale/new")}
          />
          <QuickAction
            label="Expense"
            icon="credit-card"
            onPress={() => router.push("/expense/new")}
          />
          <QuickAction
            label="Product"
            icon="package"
            onPress={() => router.push("/product/new")}
          />
          <QuickAction
            label="AI report"
            icon="zap"
            onPress={() => router.push("/assistant")}
            highlight
          />
        </View>

        {loading && (
          <View style={{ alignItems: "center", padding: 16 }}>
            <ActivityIndicator color={c.primary} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function QuickAction({
  label,
  icon,
  onPress,
  highlight,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  highlight?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.qa,
        {
          backgroundColor: highlight ? c.primary : c.card,
          borderColor: highlight ? c.primary : c.border,
          borderRadius: c.radius,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Feather name={icon} size={20} color={highlight ? c.primaryForeground : c.foreground} />
      <Text
        style={[
          styles.qaLabel,
          { color: highlight ? c.primaryForeground : c.foreground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 140,
    gap: 14,
  },
  hero: {
    padding: 22,
    gap: 8,
  },
  heroLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    opacity: 0.7,
  },
  heroValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    letterSpacing: -1,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 14,
  },
  heroItem: { flex: 1, gap: 4 },
  heroDivider: { width: 1, height: 36, backgroundColor: "#ffffff22" },
  heroSubLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    opacity: 0.7,
  },
  heroSubValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  grid: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    padding: 16,
    borderWidth: 1,
    gap: 4,
  },
  proTeaser: {
    padding: 20,
    gap: 4,
  },
  miniHeading: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: 4,
    marginBottom: 6,
  },
  miniRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressWrap: { gap: 8, marginTop: 4 },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  topName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  topMeta: { fontFamily: "Inter_500Medium", fontSize: 12 },
  topAmount: { fontFamily: "Inter_700Bold", fontSize: 14 },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  qa: {
    flex: 1,
    minWidth: "47%",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qaLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
