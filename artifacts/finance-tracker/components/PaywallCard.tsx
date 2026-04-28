import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";

export function PaywallCard({
  feature,
  description,
}: {
  feature: string;
  description: string;
}) {
  const c = useColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: c.heroBg,
          borderRadius: c.radius + 4,
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: c.primary }]}>
        <Feather name="lock" size={22} color={c.primaryForeground} />
      </View>
      <Text style={[styles.kicker, { color: c.heroForeground, opacity: 0.6 }]}>PRO FEATURE</Text>
      <Text style={[styles.title, { color: c.heroForeground }]}>{feature}</Text>
      <Text style={[styles.body, { color: c.heroForeground, opacity: 0.75 }]}>
        {description}
      </Text>
      <View style={{ marginTop: 18 }}>
        <Button
          label="Upgrade to Pro"
          icon="zap"
          onPress={() => router.push("/upgrade")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    alignItems: "flex-start",
    gap: 6,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  kicker: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  body: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
});
