import React from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router, Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { PaywallCard } from "@/components/PaywallCard";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { usePlan } from "@/contexts/PlanContext";
import { useColors } from "@/hooks/useColors";
import { deleteCustomer } from "@/services/firebaseService";
import { confirm } from "@/utils/confirm";
import { Customer } from "@/types";

export default function CustomersScreen() {
  const c = useColors();
  const { isPro } = usePlan();
  const { customers, invoices } = useData();
  const { user } = useAuth();

  const onDelete = async (cust: Customer) => {
    const ok = await confirm({
      title: "Delete customer",
      message: `Remove ${cust.name}?`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok || !user) return;
    try {
      await deleteCustomer(user.uid, cust.id);
    } catch (err: any) {
      Alert.alert("Couldn't delete", err?.message ?? "Please try again.");
    }
  };

  if (!isPro) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader
          title="Customers"
          subtitle="Pro feature"
          rightIcon="x"
          onRightPress={() => router.back()}
        />
        <View style={{ padding: 20 }}>
          <PaywallCard
            feature="Customer manager"
            description="Keep all your customer details, notes and history in one place. Linked to invoices."
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader
        title="Customers"
        subtitle={`${customers.length} contact${customers.length === 1 ? "" : "s"}`}
        rightIcon="plus"
        rightLabel="New"
        onRightPress={() => router.push("/customer/new")}
        secondaryIcon="arrow-left"
        onSecondaryPress={() => router.back()}
      />
      <FlatList
        data={customers}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <EmptyState
            icon="users"
            title="No customers yet"
            message="Add your first customer to start sending invoices."
            action={
              <Button
                label="Add customer"
                icon="user-plus"
                onPress={() => router.push("/customer/new")}
              />
            }
          />
        }
        renderItem={({ item }) => {
          const totalOwed = invoices
            .filter((i) => i.customerId === item.id && i.status !== "paid")
            .reduce((a, i) => a + i.total, 0);
          return (
            <Pressable
              onPress={() => router.push({ pathname: "/customer/[id]", params: { id: item.id } })}
              onLongPress={() => onDelete(item)}
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
              <View style={[styles.avatar, { backgroundColor: c.accent }]}>
                <Text style={{ color: c.accentForeground, fontFamily: "Inter_700Bold", fontSize: 16 }}>
                  {item.name?.[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: c.foreground }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.meta, { color: c.mutedForeground }]} numberOfLines={1}>
                  {item.email || item.phone || "No contact"}
                </Text>
              </View>
              {totalOwed > 0 ? (
                <View style={[styles.pill, { backgroundColor: `${c.warning}22` }]}>
                  <Text style={{ color: c.warning, fontFamily: "Inter_700Bold", fontSize: 11 }}>
                    Owes
                  </Text>
                </View>
              ) : (
                <Feather name="chevron-right" size={18} color={c.mutedForeground} />
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 140, flexGrow: 1 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontFamily: "Inter_700Bold", fontSize: 15 },
  meta: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
});
