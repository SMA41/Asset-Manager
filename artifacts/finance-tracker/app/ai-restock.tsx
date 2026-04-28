import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { SectionHeader } from "@/components/SectionHeader";
import { PaywallCard } from "@/components/PaywallCard";
import { useData } from "@/contexts/DataContext";
import { usePlan } from "@/contexts/PlanContext";
import { useColors } from "@/hooks/useColors";
import { generateRestockSuggestions } from "@/services/aiService";

export default function AIRestockScreen() {
  const c = useColors();
  const { isPro } = usePlan();
  const { products, sales } = useData();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await generateRestockSuggestions({ products, sales });
      setText(result);
    } catch (err: any) {
      Alert.alert("Couldn't generate", err?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isPro) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader title="AI restock" subtitle="Pro feature" rightIcon="x" onRightPress={() => router.back()} />
        <View style={{ padding: 20 }}>
          <PaywallCard
            feature="AI restock advisor"
            description="Let the AI look at your sales history and stock to recommend exactly what to buy more of."
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader
        title="AI restock"
        subtitle="Smart buy suggestions"
        rightIcon="arrow-left"
        onRightPress={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.hero,
            { backgroundColor: c.heroBg, borderRadius: c.radius + 4 },
          ]}
        >
          <View style={[styles.iconLg, { backgroundColor: c.primary }]}>
            <Feather name="shopping-bag" size={22} color={c.primaryForeground} />
          </View>
          <Text style={{ color: c.heroForeground, fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: -0.5, marginTop: 14 }}>
            Should I buy more?
          </Text>
          <Text style={{ color: c.heroForeground, opacity: 0.7, fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 6, lineHeight: 18 }}>
            The AI weighs your last 60 days of sales against current stock, then ranks what to restock first.
          </Text>
          <View style={{ marginTop: 16 }}>
            <Button
              label={loading ? "Analyzing…" : text ? "Generate again" : "Generate suggestions"}
              icon="zap"
              loading={loading}
              onPress={handleGenerate}
            />
          </View>
        </View>

        {text ? (
          <View
            style={[
              styles.card,
              { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
            ]}
          >
            <SectionHeader title="Recommendations" />
            <Text
              style={{
                color: c.foreground,
                fontFamily: "Inter_500Medium",
                fontSize: 14,
                lineHeight: 22,
              }}
            >
              {text}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 60, gap: 14 },
  hero: { padding: 22 },
  iconLg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  card: { padding: 16, borderWidth: 1 },
});
