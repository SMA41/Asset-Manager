import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

export function ProBadge({ size = "sm", style }: { size?: "sm" | "md"; style?: ViewStyle }) {
  const c = useColors();
  const isMd = size === "md";
  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: c.heroBg,
          paddingHorizontal: isMd ? 10 : 7,
          paddingVertical: isMd ? 4 : 2,
        },
        style,
      ]}
    >
      <Feather name="zap" size={isMd ? 12 : 10} color={c.background} />
      <Text
        style={{
          color: c.heroForeground,
          fontFamily: "Inter_700Bold",
          fontSize: isMd ? 11 : 10,
          letterSpacing: 0.6,
        }}
      >
        PRO
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
});
