import React, { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Stack, router } from "expo-router";

import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { setMonthlyBudget } from "@/services/firebaseService";
import { monthKey, monthLabel } from "@/utils/format";

export default function BudgetScreen() {
  const c = useColors();
  const { user } = useAuth();
  const { budgets } = useData();
  const month = useMemo(() => monthKey(new Date()), []);
  const existing = budgets.find((b) => b.month === month)?.amount ?? 0;
  const [amount, setAmount] = useState(existing ? String(existing) : "");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await setMonthlyBudget(user.uid, month, Number(amount) || 0);
      router.back();
    } catch (err: any) {
      Alert.alert("Couldn't save", err?.message ?? "Try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ title: "Monthly budget", headerShown: true }} />
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={styles.container}
        bottomOffset={20}
        style={{ backgroundColor: c.background }}
      >
        <Text style={[styles.h1, { color: c.foreground }]}>{monthLabel(month)}</Text>
        <Text style={[styles.h2, { color: c.mutedForeground }]}>
          Set how much you plan to spend on operating expenses this month. The dashboard will warn
          you when you go over.
        </Text>

        <View style={{ marginTop: 20 }}>
          <Input
            label="Budget amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            prefix="$"
          />
        </View>
        <View style={{ marginTop: 24 }}>
          <Button label="Save budget" onPress={submit} loading={busy} icon="check" />
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  h1: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
});
