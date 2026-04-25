import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, router } from "expo-router";

import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { createExpense } from "@/services/firebaseService";
import { EXPENSE_CATEGORIES, ExpenseCategory } from "@/constants/categories";

export default function NewExpenseScreen() {
  const c = useColors();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Other");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (!title.trim() || !amount) {
      Alert.alert("Missing info", "Add a title and amount.");
      return;
    }
    setBusy(true);
    try {
      await createExpense(user.uid, {
        title: title.trim(),
        amount: Number(amount) || 0,
        category,
        note: note.trim(),
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
      <Stack.Screen options={{ title: "New expense", headerShown: true }} />
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={styles.container}
        bottomOffset={20}
        style={{ backgroundColor: c.background }}
      >
        <View style={{ gap: 16 }}>
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Office rent"
            autoCapitalize="sentences"
          />
          <Input
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            prefix="$"
          />
          <View style={{ gap: 8 }}>
            <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 13 }}>
              Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {EXPENSE_CATEGORIES.map((cat) => {
                const active = cat === category;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
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
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
          <Input
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            placeholder="Anything worth remembering"
            multiline
            style={{ minHeight: 60 }}
          />
        </View>
        <View style={{ marginTop: 24 }}>
          <Button label="Save expense" onPress={submit} loading={busy} icon="check" />
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
});
