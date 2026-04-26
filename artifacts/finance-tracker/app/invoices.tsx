import React, { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { StatCard } from "@/components/StatCard";
import { PaywallCard } from "@/components/PaywallCard";
import { useData } from "@/contexts/DataContext";
import { usePlan } from "@/contexts/PlanContext";
import { useColors } from "@/hooks/useColors";
import { Invoice, InvoiceStatus } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";

type Filter = "all" | "pending" | "paid" | "overdue";

export default function InvoicesScreen() {
  const c = useColors();
  const { isPro } = usePlan();
  const { invoices } = useData();
  const params = useLocalSearchParams<{ status?: string }>();
  const [filter, setFilter] = useState<Filter>((params.status as Filter) ?? "all");

  const enriched = useMemo(() => {
    const now = Date.now();
    return invoices.map((inv) => {
      let status: InvoiceStatus = inv.status;
      if (status !== "paid" && inv.dueDate < now) status = "overdue";
      return { ...inv, status };
    });
  }, [invoices]);

  const filtered = useMemo(() => {
    if (filter === "all") return enriched;
    if (filter === "pending") return enriched.filter((i) => i.status === "sent" || i.status === "draft");
    if (filter === "paid") return enriched.filter((i) => i.status === "paid");
    if (filter === "overdue") return enriched.filter((i) => i.status === "overdue");
    return enriched;
  }, [enriched, filter]);

  const totals = useMemo(() => {
    const outstanding = enriched.filter((i) => i.status !== "paid").reduce((a, i) => a + i.total, 0);
    const overdue = enriched.filter((i) => i.status === "overdue").reduce((a, i) => a + i.total, 0);
    const paid = enriched.filter((i) => i.status === "paid").reduce((a, i) => a + i.total, 0);
    return { outstanding, overdue, paid };
  }, [enriched]);

  if (!isPro) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader title="Invoices" subtitle="Pro feature" rightIcon="x" onRightPress={() => router.back()} />
        <View style={{ padding: 20 }}>
          <PaywallCard
            feature="Invoice generator"
            description="Create itemized invoices for your customers, track payments, and never lose track of who owes you."
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader
        title="Invoices"
        subtitle="Bill customers and track payments"
        rightIcon="plus"
        rightLabel="New"
        onRightPress={() => router.push("/invoice/new")}
        secondaryIcon="arrow-left"
        onSecondaryPress={() => router.back()}
      />
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 14 }}>
            <View style={styles.statsRow}>
              <StatCard
                label="Outstanding"
                value={formatCurrency(totals.outstanding)}
                icon="clock"
                tone="warning"
                style={{ flex: 1 }}
              />
              <StatCard
                label="Overdue"
                value={formatCurrency(totals.overdue)}
                icon="alert-triangle"
                tone="negative"
                style={{ flex: 1 }}
              />
            </View>
            <StatCard
              label="Paid this period"
              value={formatCurrency(totals.paid)}
              icon="check-circle"
              tone="positive"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {(["all", "pending", "overdue", "paid"] as Filter[]).map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setFilter(f)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: filter === f ? c.foreground : c.card,
                      borderColor: filter === f ? c.foreground : c.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: filter === f ? c.background : c.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 12,
                      textTransform: "capitalize",
                    }}
                  >
                    {f}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="file-text"
            title={filter === "all" ? "No invoices yet" : `No ${filter} invoices`}
            message={
              filter === "all"
                ? "Generate your first invoice to start tracking what you're owed."
                : "Try switching the filter to see more."
            }
            action={
              filter === "all" ? (
                <Button label="New invoice" icon="plus" onPress={() => router.push("/invoice/new")} />
              ) : undefined
            }
          />
        }
        renderItem={({ item }) => <InvoiceRow invoice={item} />}
      />
    </View>
  );
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const c = useColors();
  const tone =
    invoice.status === "paid"
      ? c.success
      : invoice.status === "overdue"
      ? c.danger
      : c.warning;
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/invoice/[id]", params: { id: invoice.id } })}
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
      <View style={[styles.icon, { backgroundColor: `${tone}22` }]}>
        <Feather name="file-text" size={18} color={tone} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: c.foreground }]} numberOfLines={1}>
          {invoice.customerName || "Customer"}
        </Text>
        <Text style={[styles.meta, { color: c.mutedForeground }]} numberOfLines={1}>
          {invoice.number} · Due {formatDate(invoice.dueDate)}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={[styles.amount, { color: c.foreground }]}>
          {formatCurrency(invoice.total)}
        </Text>
        <Text style={[styles.status, { color: tone, textTransform: "uppercase" }]}>
          {invoice.status}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 140, flexGrow: 1 },
  statsRow: { flexDirection: "row", gap: 12 },
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
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontFamily: "Inter_700Bold", fontSize: 14 },
  meta: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 },
  amount: { fontFamily: "Inter_700Bold", fontSize: 15 },
  status: { fontFamily: "Inter_700Bold", fontSize: 10, marginTop: 2, letterSpacing: 0.6 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
});
