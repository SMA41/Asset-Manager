import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { ProBadge } from "@/components/ProBadge";
import { usePlan } from "@/contexts/PlanContext";
import { useColors } from "@/hooks/useColors";

const FEATURES = [
  { icon: "users" as const, title: "Customer manager", body: "Keep contact info and notes for every customer." },
  { icon: "file-text" as const, title: "Invoice generator", body: "Create line-itemized invoices with tax and totals." },
  { icon: "clock" as const, title: "Pending payments", body: "Track unpaid invoices and overdue follow-ups." },
  { icon: "message-square" as const, title: "AI payment reminders", body: "Generate polite reminder messages instantly." },
  { icon: "bar-chart-2" as const, title: "Advanced analytics", body: "Top sellers, monthly trends and margin per product." },
  { icon: "shopping-bag" as const, title: "AI restock advisor", body: "Smart suggestions on what to buy more of." },
  { icon: "upload" as const, title: "Bulk product import", body: "Add many products at once via paste or CSV." },
  { icon: "calendar" as const, title: "Auto monthly reports", body: "Generate reports for any past month, on demand." },
];

export default function UpgradeScreen() {
  const c = useColors();
  const { upgrade, isPro } = usePlan();
  const [busy, setBusy] = useState(false);

  const handleUpgrade = async () => {
    if (isPro || busy) return;
    setBusy(true);
    try {
      await upgrade();
      Alert.alert("You're on Pro", "All advanced features are unlocked.", [
        { text: "Awesome", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Couldn't upgrade", err?.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader
        title="Upgrade"
        subtitle="Get every Pro feature"
        rightIcon="x"
        onRightPress={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.hero,
            { backgroundColor: c.heroBg, borderRadius: c.radius + 4 },
          ]}
        >
          <ProBadge size="md" />
          <Text style={{ color: c.heroForeground, fontFamily: "Inter_700Bold", fontSize: 30, letterSpacing: -0.6, marginTop: 10 }}>
            $9 / month
          </Text>
          <Text style={{ color: c.heroForeground, opacity: 0.7, fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 4 }}>
            Cancel anytime · Everything unlocked
          </Text>
        </View>

        <View
          style={[
            styles.list,
            { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
          ]}
        >
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: c.accent }]}>
                <Feather name={f.icon} size={16} color={c.accentForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                  {f.title}
                </Text>
                <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 }}>
                  {f.body}
                </Text>
              </View>
              <Feather name="check" size={16} color={c.success} />
            </View>
          ))}
        </View>

        {isPro ? (
          <View style={[styles.notice, { backgroundColor: c.accent, borderRadius: c.radius }]}>
            <Feather name="check-circle" size={16} color={c.accentForeground} />
            <Text style={{ color: c.accentForeground, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
              You're already on Pro.
            </Text>
          </View>
        ) : (
          <Button
            label={busy ? "Upgrading…" : "Upgrade to Pro"}
            icon="zap"
            loading={busy}
            onPress={handleUpgrade}
          />
        )}

        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12, textAlign: "center", marginTop: 4 }}>
          This is a demo plan toggle. No real charges are made.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 60, gap: 16 },
  hero: { padding: 24, gap: 6, alignItems: "flex-start" },
  list: { padding: 6, borderWidth: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
