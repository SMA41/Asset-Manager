import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

export function AppHeader({
  title,
  subtitle,
  rightIcon,
  onRightPress,
  rightLabel,
  secondaryIcon,
  onSecondaryPress,
}: {
  title: string;
  subtitle?: string;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightPress?: () => void;
  rightLabel?: string;
  secondaryIcon?: keyof typeof Feather.glyphMap;
  onSecondaryPress?: () => void;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 8);

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: topPad + 8,
          backgroundColor: c.background,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
            {subtitle}
          </Text>
        ) : null}
        <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
      </View>
      {secondaryIcon ? (
        <Pressable
          onPress={onSecondaryPress}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: c.muted,
              borderColor: c.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name={secondaryIcon} size={18} color={c.foreground} />
        </Pressable>
      ) : null}
      {rightIcon ? (
        <Pressable
          onPress={onRightPress}
          style={({ pressed }) => [
            styles.right,
            {
              backgroundColor: c.accent,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name={rightIcon} size={18} color={c.accentForeground} />
          {rightLabel ? (
            <Text style={[styles.rightLabel, { color: c.accentForeground }]}>
              {rightLabel}
            </Text>
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 999,
  },
  rightLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
