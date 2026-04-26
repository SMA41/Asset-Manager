import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { PaywallCard } from "@/components/PaywallCard";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/contexts/PlanContext";
import { useColors } from "@/hooks/useColors";
import { createProductsBulk } from "@/services/firebaseService";

type ParsedProduct = {
  name: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  error?: string;
};

function parseLine(line: string): ParsedProduct | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(",").map((p) => p.trim());
  if (parts.length < 3) {
    return { name: trimmed, costPrice: 0, sellingPrice: 0, stock: 0, error: "Need at least name, cost, sell" };
  }
  const [name, costStr, sellStr, stockStr] = parts;
  const costPrice = Number(costStr);
  const sellingPrice = Number(sellStr);
  const stock = stockStr === undefined ? 0 : Number(stockStr);
  let error: string | undefined;
  if (!name) error = "Name missing";
  else if (!Number.isFinite(costPrice) || costPrice < 0) error = "Bad cost";
  else if (!Number.isFinite(sellingPrice) || sellingPrice < 0) error = "Bad sell price";
  else if (!Number.isFinite(stock) || stock < 0) error = "Bad stock";
  return { name, costPrice, sellingPrice, stock, error };
}

export default function BulkProductsScreen() {
  const c = useColors();
  const { isPro } = usePlan();
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(() => {
    return text.split(/\r?\n/).map(parseLine).filter(Boolean) as ParsedProduct[];
  }, [text]);

  const valid = parsed.filter((p) => !p.error);
  const invalid = parsed.filter((p) => p.error);

  const handleSave = async () => {
    if (!user) return;
    if (valid.length === 0) {
      Alert.alert("Nothing to import", "Add at least one valid product line.");
      return;
    }
    setSaving(true);
    try {
      await createProductsBulk(
        user.uid,
        valid.map((p) => ({
          name: p.name,
          costPrice: p.costPrice,
          sellingPrice: p.sellingPrice,
          stock: p.stock,
        }))
      );
      Alert.alert("Imported", `${valid.length} product${valid.length === 1 ? "" : "s"} added.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Couldn't import", err?.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSample = () => {
    setText(
      [
        "Espresso Beans 1kg, 12.50, 24, 30",
        "Filter coffee 250g, 4.20, 9, 50",
        "Travel mug, 6.00, 14.99, 12",
      ].join("\n")
    );
  };

  if (!isPro) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader title="Bulk import" subtitle="Pro feature" rightIcon="x" onRightPress={() => router.back()} />
        <View style={{ padding: 20 }}>
          <PaywallCard
            feature="Bulk product import"
            description="Paste many products at once or import from a CSV. Save hours of manual entry."
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader
        title="Bulk import"
        subtitle="Add many products at once"
        rightIcon="arrow-left"
        onRightPress={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View
          style={[
            styles.help,
            { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
          ]}
        >
          <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 14 }}>
            Format · one product per line
          </Text>
          <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 4 }}>
            name, cost price, sell price, stock
          </Text>
          <Pressable onPress={handleSample} style={({ pressed }) => ({ marginTop: 10, opacity: pressed ? 0.7 : 1 })}>
            <Text style={{ color: c.primary, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
              Use sample data →
            </Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.editor,
            { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
          ]}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={"Espresso beans, 12.50, 24, 30\nFilter coffee, 4.20, 9, 50"}
            placeholderTextColor={c.mutedForeground}
            multiline
            style={{
              color: c.foreground,
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              minHeight: 200,
              padding: 14,
              textAlignVertical: "top",
            }}
          />
        </View>

        {parsed.length > 0 && (
          <View
            style={[
              styles.previewCard,
              { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
            ]}
          >
            <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 8 }}>
              Preview · {valid.length} ready{invalid.length > 0 ? ` · ${invalid.length} need fixing` : ""}
            </Text>
            {parsed.map((p, idx) => (
              <View key={idx} style={[styles.previewRow, { borderBottomColor: c.border }]}>
                <Feather
                  name={p.error ? "alert-circle" : "check-circle"}
                  size={14}
                  color={p.error ? c.danger : c.success}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.foreground, fontFamily: "Inter_600SemiBold", fontSize: 13 }} numberOfLines={1}>
                    {p.name || "(no name)"}
                  </Text>
                  <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 11 }}>
                    {p.error
                      ? p.error
                      : `Cost $${p.costPrice} · Sell $${p.sellingPrice} · Stock ${p.stock}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <Button
          label={saving ? "Importing…" : `Import ${valid.length} product${valid.length === 1 ? "" : "s"}`}
          icon="upload"
          loading={saving}
          disabled={valid.length === 0}
          onPress={handleSave}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 60, gap: 14 },
  help: { padding: 16, borderWidth: 1 },
  editor: { borderWidth: 1, overflow: "hidden" },
  previewCard: { padding: 14, borderWidth: 1 },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
