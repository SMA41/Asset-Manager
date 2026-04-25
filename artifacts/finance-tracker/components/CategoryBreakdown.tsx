import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { formatCurrency } from "@/utils/format";

export function CategoryBreakdown({
  items,
}: {
  items: Array<{ category: string; amount: number }>;
}) {
  const c = useColors();
  if (!items.length) return null;
  const total = items.reduce((a, b) => a + b.amount, 0);
  const palette = [c.chart1, c.chart2, c.chart3, c.chart4, c.chart5];

  return (
    <View style={{ gap: 14 }}>
      <View style={[styles.bar, { backgroundColor: c.muted }]}>
        {items.slice(0, 5).map((it, idx) => {
          const w = total > 0 ? (it.amount / total) * 100 : 0;
          return (
            <View
              key={it.category}
              style={{
                width: `${w}%`,
                height: "100%",
                backgroundColor: palette[idx % palette.length],
              }}
            />
          );
        })}
      </View>
      <View style={{ gap: 10 }}>
        {items.slice(0, 5).map((it, idx) => {
          const pct = total > 0 ? (it.amount / total) * 100 : 0;
          return (
            <View key={it.category} style={styles.row}>
              <View style={styles.left}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: palette[idx % palette.length] },
                  ]}
                />
                <Text style={[styles.cat, { color: c.foreground }]}>
                  {it.category}
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={[styles.amount, { color: c.foreground }]}>
                  {formatCurrency(it.amount)}
                </Text>
                <Text style={[styles.pct, { color: c.mutedForeground }]}>
                  {pct.toFixed(0)}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    flexDirection: "row",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  right: { alignItems: "flex-end" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  cat: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  amount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  pct: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
});
