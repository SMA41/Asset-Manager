import React, { useMemo } from "react";
import {
  Alert,
  FlatList,
  Pressable,
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
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { deleteSale } from "@/services/firebaseService";
import { confirm } from "@/utils/confirm";
import { buildCsv, exportCsv } from "@/utils/exportCsv";
import { formatCurrency, formatDateTime, monthKey } from "@/utils/format";
import { Sale } from "@/types";

export default function SalesScreen() {
  const c = useColors();
  const { sales } = useData();
  const { user } = useAuth();

  const monthlyAgg = useMemo(() => {
    const month = monthKey(new Date());
    const inMonth = sales.filter((s) => monthKey(new Date(s.date)) === month);
    return {
      total: inMonth.reduce((a, s) => a + s.revenue, 0),
      profit: inMonth.reduce((a, s) => a + s.profit, 0),
      units: inMonth.reduce((a, s) => a + s.quantity, 0),
    };
  }, [sales]);

  const onDelete = async (s: Sale) => {
    const ok = await confirm({
      title: "Delete sale",
      message: "This won't restore stock. Continue?",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok || !user) return;
    try {
      await deleteSale(user.uid, s.id);
    } catch (err: any) {
      Alert.alert("Couldn't delete", err?.message ?? "Please try again.");
    }
  };

  const onExport = async () => {
    if (sales.length === 0) {
      Alert.alert("Nothing to export", "Record a sale first.");
      return;
    }
    try {
      const csv = buildCsv(sales, [
        { header: "Date", get: (s) => new Date(s.date).toISOString() },
        { header: "Product", get: (s) => s.productName },
        { header: "Quantity", get: (s) => s.quantity },
        { header: "Unit price", get: (s) => s.unitPrice.toFixed(2) },
        { header: "Unit cost", get: (s) => s.unitCost.toFixed(2) },
        { header: "Revenue", get: (s) => s.revenue.toFixed(2) },
        { header: "Profit", get: (s) => s.profit.toFixed(2) },
      ]);
      const stamp = new Date().toISOString().slice(0, 10);
      await exportCsv(`sales-${stamp}.csv`, csv);
    } catch (err: any) {
      Alert.alert("Export failed", err?.message ?? "Please try again.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <AppHeader
        title="Sales"
        subtitle="Every transaction in one place"
        rightIcon="plus"
        rightLabel="New"
        onRightPress={() => router.push("/sale/new")}
        secondaryIcon="download"
        onSecondaryPress={onExport}
      />

      <FlatList
        data={sales}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 16 }}>
            <View style={styles.statsRow}>
              <StatCard
                label="Revenue · MTD"
                value={formatCurrency(monthlyAgg.total)}
                tone="positive"
                icon="trending-up"
                style={{ flex: 1 }}
              />
              <StatCard
                label="Profit · MTD"
                value={formatCurrency(monthlyAgg.profit)}
                tone={monthlyAgg.profit >= 0 ? "positive" : "negative"}
                icon="dollar-sign"
                style={{ flex: 1 }}
              />
            </View>
            <StatCard
              label="Units sold this month"
              value={String(monthlyAgg.units)}
              icon="shopping-bag"
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="shopping-cart"
            title="No sales recorded"
            message="Record your first sale to start tracking revenue and profit."
            action={
              <Button
                label="Record a sale"
                icon="plus"
                onPress={() => router.push("/sale/new")}
              />
            }
          />
        }
        renderItem={({ item }) => (
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
              <Feather name="arrow-up-right" size={18} color={c.accentForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: c.foreground }]} numberOfLines={1}>
                {item.productName || "Sale"}
              </Text>
              <Text style={[styles.meta, { color: c.mutedForeground }]}>
                {item.quantity} × {formatCurrency(item.unitPrice)} · {formatDateTime(item.date)}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.amount, { color: c.foreground }]}>
                {formatCurrency(item.revenue)}
              </Text>
              <Text
                style={[
                  styles.profit,
                  { color: item.profit >= 0 ? c.success : c.danger },
                ]}
              >
                {item.profit >= 0 ? "+" : ""}
                {formatCurrency(item.profit)}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
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
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  meta: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 },
  amount: { fontFamily: "Inter_700Bold", fontSize: 15 },
  profit: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 },
});
