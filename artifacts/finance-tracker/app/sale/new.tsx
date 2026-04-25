import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { recordSale } from "@/services/firebaseService";
import { formatCurrency } from "@/utils/format";

export default function NewSaleScreen() {
  const c = useColors();
  const { user } = useAuth();
  const { products } = useData();
  const params = useLocalSearchParams<{ productId?: string }>();

  const initialProductId = useMemo(() => {
    if (params.productId && products.some((p) => p.id === params.productId)) {
      return params.productId as string;
    }
    return products[0]?.id ?? "";
  }, [products, params.productId]);

  const [productId, setProductId] = useState<string>(initialProductId);
  const [qty, setQty] = useState("1");
  const [busy, setBusy] = useState(false);

  const product = products.find((p) => p.id === productId);
  const quantity = Math.max(0, Math.floor(Number(qty) || 0));
  const revenue = (product?.sellingPrice ?? 0) * quantity;
  const profit = ((product?.sellingPrice ?? 0) - (product?.costPrice ?? 0)) * quantity;

  const submit = async () => {
    if (!user || !product) return;
    if (quantity <= 0) {
      Alert.alert("Invalid quantity", "Enter a quantity greater than zero.");
      return;
    }
    if (quantity > product.stock) {
      Alert.alert("Not enough stock", `Only ${product.stock} in stock.`);
      return;
    }
    setBusy(true);
    try {
      await recordSale(user.uid, { productId: product.id, quantity });
      router.back();
    } catch (err: any) {
      Alert.alert("Couldn't record sale", err?.message ?? "Try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ title: "Record sale", headerShown: true }} />
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={styles.container}
        bottomOffset={20}
        style={{ backgroundColor: c.background }}
      >
        {products.length === 0 ? (
          <EmptyState
            icon="package"
            title="Add a product first"
            message="You need at least one product before recording a sale."
            action={
              <Button
                label="Create product"
                icon="plus"
                onPress={() => router.replace("/product/new")}
              />
            }
          />
        ) : (
          <>
            <Text style={[styles.label, { color: c.mutedForeground }]}>Product</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
            >
              {products.map((p) => {
                const active = p.id === productId;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setProductId(p.id)}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: active ? c.foreground : c.card,
                        borderColor: active ? c.foreground : c.border,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? c.background : c.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 13,
                      }}
                    >
                      {p.name}
                    </Text>
                    <Text
                      style={{
                        color: active ? c.background : c.mutedForeground,
                        opacity: 0.8,
                        fontFamily: "Inter_500Medium",
                        fontSize: 11,
                      }}
                    >
                      {formatCurrency(p.sellingPrice)} · {p.stock} left
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={{ marginTop: 16 }}>
              <Input
                label="Quantity"
                value={qty}
                onChangeText={setQty}
                keyboardType="number-pad"
                placeholder="1"
              />
            </View>

            <View
              style={[
                styles.summary,
                { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
              ]}
            >
              <SummaryRow label="Unit price" value={formatCurrency(product?.sellingPrice ?? 0)} />
              <SummaryRow label="Quantity" value={String(quantity)} />
              <SummaryRow
                label="Revenue"
                value={formatCurrency(revenue)}
                emphasis
              />
              <SummaryRow
                label="Estimated profit"
                value={formatCurrency(profit)}
                tone={profit >= 0 ? c.success : c.danger}
              />
            </View>

            <View style={{ marginTop: 20 }}>
              <Button
                label="Record sale"
                icon="check"
                onPress={submit}
                loading={busy}
                disabled={!product || quantity <= 0}
              />
            </View>

            {product && quantity > product.stock ? (
              <View style={[styles.warn, { backgroundColor: `${c.danger}15`, borderColor: c.danger }]}>
                <Feather name="alert-circle" size={14} color={c.danger} />
                <Text style={{ color: c.danger, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
                  Only {product.stock} in stock.
                </Text>
              </View>
            ) : null}
          </>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  emphasis,
  tone,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  tone?: string;
}) {
  const c = useColors();
  return (
    <View style={styles.sumRow}>
      <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 13 }}>
        {label}
      </Text>
      <Text
        style={{
          color: tone ?? c.foreground,
          fontFamily: emphasis ? "Inter_700Bold" : "Inter_600SemiBold",
          fontSize: emphasis ? 16 : 14,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  summary: {
    padding: 16,
    borderWidth: 1,
    gap: 8,
    marginTop: 16,
  },
  sumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  warn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
});
