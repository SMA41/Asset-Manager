import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  actionIcon,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: keyof typeof Feather.glyphMap;
  onAction?: () => void;
}) {
  const c = useColors();
  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actionLabel ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: c.accent, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          {actionIcon && <Feather name={actionIcon} size={14} color={c.accentForeground} />}
          <Text style={[styles.actionLabel, { color: c.accentForeground }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    marginTop: 2,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  actionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
