import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

export function StatCard({
  label,
  value,
  delta,
  icon,
  tone = "default",
  style,
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: keyof typeof Feather.glyphMap;
  tone?: "default" | "positive" | "negative" | "warning";
  style?: ViewStyle;
}) {
  const c = useColors();
  const accentColor =
    tone === "positive"
      ? c.success
      : tone === "negative"
      ? c.danger
      : tone === "warning"
      ? c.warning
      : c.primary;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.card, borderRadius: c.radius, borderColor: c.border },
        style,
      ]}
    >
      <View style={styles.row}>
        <Text style={[styles.label, { color: c.mutedForeground }]}>{label}</Text>
        {icon && (
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: tone === "default" ? c.accent : `${accentColor}22` },
            ]}
          >
            <Feather name={icon} size={14} color={accentColor} />
          </View>
        )}
      </View>
      <Text style={[styles.value, { color: c.foreground }]} numberOfLines={1}>
        {value}
      </Text>
      {delta ? (
        <Text style={[styles.delta, { color: accentColor }]}>{delta}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  value: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.4,
  },
  delta: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
});
