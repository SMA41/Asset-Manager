import React from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { deleteProduct } from "@/services/firebaseService";
import { formatCurrency } from "@/utils/format";
import { Product } from "@/types";

export default function ProductsScreen() {
  const c = useColors();
  const { products } = useData();
  const { user } = useAuth();

  const onDelete = (p: Product) => {
    Alert.alert("Delete product", `Remove ${p.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!user) return;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          await deleteProduct(user.uid, p.id);
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <AppHeader
        title="Products"
        subtitle={`${products.length} item${products.length === 1 ? "" : "s"}`}
        rightIcon="plus"
        rightLabel="New"
        onRightPress={() => router.push("/product/new")}
        secondaryIcon="upload"
        onSecondaryPress={() => router.push("/bulk-products")}
      />
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <EmptyState
            icon="package"
            title="No products yet"
            message="Add the items you buy and sell to start tracking sales and stock."
            action={
              <Button
                label="Add your first product"
                icon="plus"
                onPress={() => router.push("/product/new")}
              />
            }
          />
        }
        renderItem={({ item }) => {
          const margin =
            item.sellingPrice > 0
              ? ((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100
              : 0;
          const lowStock = item.stock <= 5;
          return (
            <Pressable
              onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id } })}
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
              <View style={styles.row}>
                <View style={[styles.icon, { backgroundColor: c.accent }]}>
                  <Feather name="box" size={20} color={c.accentForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: c.foreground }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.meta, { color: c.mutedForeground }]}>
                    Cost {formatCurrency(item.costPrice)} · Sell {formatCurrency(item.sellingPrice)}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.price, { color: c.foreground }]}>
                    {formatCurrency(item.sellingPrice)}
                  </Text>
                  <Text style={[styles.margin, { color: margin >= 0 ? c.success : c.danger }]}>
                    {margin.toFixed(0)}% margin
                  </Text>
                </View>
              </View>
              <View style={styles.footer}>
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: lowStock ? `${c.warning}22` : c.muted,
                    },
                  ]}
                >
                  <Feather
                    name={lowStock ? "alert-triangle" : "layers"}
                    size={12}
                    color={lowStock ? c.warning : c.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.pillText,
                      { color: lowStock ? c.warning : c.mutedForeground },
                    ]}
                  >
                    {item.stock} in stock
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    router.push({ pathname: "/sale/new", params: { productId: item.id } })
                  }
                  style={({ pressed }) => [
                    styles.sellBtn,
                    {
                      backgroundColor: c.primary,
                      opacity: pressed ? 0.85 : 1,
                      borderRadius: 999,
                    },
                  ]}
                  disabled={item.stock <= 0}
                >
                  <Feather name="shopping-cart" size={14} color={c.primaryForeground} />
                  <Text style={[styles.sellLabel, { color: c.primaryForeground }]}>Sell</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 20,
    paddingBottom: 140,
    flexGrow: 1,
  },
  card: {
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  meta: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 },
  price: { fontFamily: "Inter_700Bold", fontSize: 15 },
  margin: { fontFamily: "Inter_500Medium", fontSize: 11, marginTop: 2 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  sellBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sellLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
});
