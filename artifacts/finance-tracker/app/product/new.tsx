import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Stack, router } from "expo-router";

import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { createProduct } from "@/services/firebaseService";

export default function NewProductScreen() {
  const c = useColors();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [costPrice, setCost] = useState("");
  const [sellingPrice, setSell] = useState("");
  const [stock, setStock] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (!name.trim() || !sellingPrice) {
      Alert.alert("Missing info", "Add a name and a selling price.");
      return;
    }
    setBusy(true);
    try {
      await createProduct(user.uid, {
        name: name.trim(),
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        stock: Number(stock) || 0,
      });
      router.back();
    } catch (err: any) {
      Alert.alert("Couldn't save", err?.message ?? "Try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ title: "New product", headerShown: true }} />
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={styles.container}
        bottomOffset={20}
        style={{ backgroundColor: c.background }}
      >
        <View style={{ gap: 16 }}>
          <Input
            label="Product name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Espresso beans, 250g"
            autoCapitalize="sentences"
          />
          <Input
            label="Cost price"
            value={costPrice}
            onChangeText={setCost}
            keyboardType="decimal-pad"
            placeholder="0.00"
            prefix="$"
          />
          <Input
            label="Selling price"
            value={sellingPrice}
            onChangeText={setSell}
            keyboardType="decimal-pad"
            placeholder="0.00"
            prefix="$"
          />
          <Input
            label="Initial stock"
            value={stock}
            onChangeText={setStock}
            keyboardType="number-pad"
            placeholder="0"
          />
        </View>
        <View style={{ marginTop: 24 }}>
          <Button label="Save product" onPress={submit} loading={busy} icon="check" />
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 8 },
});
