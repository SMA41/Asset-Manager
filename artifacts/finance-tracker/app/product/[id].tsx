import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";

import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { deleteProduct, updateProduct } from "@/services/firebaseService";

export default function EditProductScreen() {
  const c = useColors();
  const { user } = useAuth();
  const { products } = useData();
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);

  const [name, setName] = useState("");
  const [costPrice, setCost] = useState("");
  const [sellingPrice, setSell] = useState("");
  const [stock, setStock] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCost(String(product.costPrice));
      setSell(String(product.sellingPrice));
      setStock(String(product.stock));
    }
  }, [product]);

  const save = async () => {
    if (!user || !id) return;
    setBusy(true);
    try {
      await updateProduct(user.uid, id, {
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

  const remove = () => {
    if (!user || !id) return;
    Alert.alert("Delete product", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteProduct(user.uid, id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ title: "Edit product", headerShown: true }} />
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={styles.container}
        bottomOffset={20}
        style={{ backgroundColor: c.background }}
      >
        <View style={{ gap: 16 }}>
          <Input label="Product name" value={name} onChangeText={setName} />
          <Input label="Cost price" value={costPrice} onChangeText={setCost} keyboardType="decimal-pad" prefix="$" />
          <Input label="Selling price" value={sellingPrice} onChangeText={setSell} keyboardType="decimal-pad" prefix="$" />
          <Input label="Stock" value={stock} onChangeText={setStock} keyboardType="number-pad" />
        </View>
        <View style={{ gap: 12, marginTop: 24 }}>
          <Button label="Save changes" onPress={save} loading={busy} icon="check" />
          <Button label="Delete product" onPress={remove} variant="ghost" icon="trash-2" />
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 8 },
});
