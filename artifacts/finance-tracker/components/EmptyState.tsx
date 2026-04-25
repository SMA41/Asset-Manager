import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

export function EmptyState({
  icon = "inbox",
  title,
  message,
  action,
}: {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  const c = useColors();
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: c.accent, borderRadius: 999 },
        ]}
      >
        <Feather name={icon} size={28} color={c.accentForeground} />
      </View>
      <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: c.mutedForeground }]}>{message}</Text>
      ) : null}
      {action ? <View style={{ marginTop: 12, alignSelf: "stretch" }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
    gap: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    textAlign: "center",
  },
  message: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
