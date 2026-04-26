import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppHeader } from "@/components/AppHeader";
import { ProBadge } from "@/components/ProBadge";
import { Button } from "@/components/Button";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/contexts/PlanContext";
import { useColors } from "@/hooks/useColors";
import { confirm } from "@/utils/confirm";

type Item = {
  key: string;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  href: string;
  pro?: boolean;
};

const ITEMS: Item[] = [
  {
    key: "assistant",
    label: "AI Assistant",
    description: "Chat about your finances",
    icon: "message-circle",
    href: "/assistant",
  },
  {
    key: "analytics",
    label: "Advanced analytics",
    description: "Top sellers, trends, margins",
    icon: "bar-chart-2",
    href: "/analytics",
    pro: true,
  },
  {
    key: "customers",
    label: "Customer manager",
    description: "Save customer details",
    icon: "users",
    href: "/customers",
    pro: true,
  },
  {
    key: "invoices",
    label: "Invoice generator",
    description: "Create and send invoices",
    icon: "file-text",
    href: "/invoices",
    pro: true,
  },
  {
    key: "payments",
    label: "Pending payments",
    description: "Track unpaid invoices",
    icon: "clock",
    href: "/invoices?status=pending",
    pro: true,
  },
  {
    key: "restock",
    label: "AI restock advisor",
    description: "Smart buy suggestions",
    icon: "shopping-bag",
    href: "/ai-restock",
    pro: true,
  },
  {
    key: "bulk",
    label: "Bulk product import",
    description: "Paste or CSV upload",
    icon: "upload",
    href: "/bulk-products",
    pro: true,
  },
];

export default function ProHubScreen() {
  const c = useColors();
  const { user, logOut } = useAuth();
  const { isPro, downgrade } = usePlan();

  const handleSignOut = async () => {
    const ok = await confirm({
      title: "Sign out",
      message: "You'll need to log in again next time.",
      confirmLabel: "Sign out",
      destructive: true,
    });
    if (ok) await logOut();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <AppHeader
        title="More"
        subtitle={isPro ? "You're on Pro" : "Unlock advanced tools"}
        rightIcon="log-out"
        onRightPress={handleSignOut}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero / plan card */}
        <View
          style={[
            styles.hero,
            { backgroundColor: c.foreground, borderRadius: c.radius + 4 },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ color: c.background, opacity: 0.7, fontFamily: "Inter_600SemiBold", fontSize: 12, letterSpacing: 1.2 }}>
              {isPro ? "PRO PLAN" : "FREE PLAN"}
            </Text>
            {isPro && <ProBadge size="sm" />}
          </View>
          <Text style={{ color: c.background, fontFamily: "Inter_700Bold", fontSize: 26, letterSpacing: -0.5, marginTop: 6 }}>
            {isPro ? "All features unlocked" : "Grow with Pro"}
          </Text>
          <Text style={{ color: c.background, opacity: 0.7, fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 6, lineHeight: 18 }}>
            {isPro
              ? "Customers, invoices, advanced analytics and AI suggestions are all available."
              : "Customers, invoices, AI restock advice, advanced charts and bulk import — one upgrade unlocks them all."}
          </Text>
          <View style={{ marginTop: 14 }}>
            {isPro ? (
              <Button
                label="Manage plan"
                icon="settings"
                variant="secondary"
                onPress={async () => {
                  const ok = await confirm({
                    title: "Cancel Pro",
                    message: "You'll lose access to advanced features.",
                    confirmLabel: "Cancel Pro",
                    destructive: true,
                  });
                  if (ok) await downgrade();
                }}
              />
            ) : (
              <Button
                label="Upgrade to Pro"
                icon="zap"
                onPress={() => router.push("/upgrade")}
              />
            )}
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>
          {isPro ? "PRO TOOLS" : "EXPLORE FEATURES"}
        </Text>

        <View style={styles.grid}>
          {ITEMS.map((item) => {
            const locked = !!item.pro && !isPro;
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  if (locked) {
                    router.push("/upgrade");
                  } else {
                    router.push(item.href as any);
                  }
                }}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: c.card,
                    borderColor: c.border,
                    borderRadius: c.radius,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: c.accent }]}>
                  <Feather name={item.icon} size={20} color={c.accentForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={[styles.cardTitle, { color: c.foreground }]}>{item.label}</Text>
                    {item.pro && <ProBadge size="sm" />}
                  </View>
                  <Text style={[styles.cardBody, { color: c.mutedForeground }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
                <Feather
                  name={locked ? "lock" : "chevron-right"}
                  size={18}
                  color={c.mutedForeground}
                />
              </Pressable>
            );
          })}
        </View>

        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12, textAlign: "center", marginTop: 12 }}>
          Signed in as {user?.email}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 140, gap: 14 },
  hero: { padding: 22, gap: 4 },
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: 8,
  },
  grid: { gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderWidth: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  cardBody: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginTop: 2,
  },
});
