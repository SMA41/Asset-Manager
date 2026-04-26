import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import {
  createCustomer,
  deleteCustomer,
  updateCustomer,
} from "@/services/firebaseService";
import { confirm } from "@/utils/confirm";

export default function CustomerEditScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = !id || id === "new";
  const { user } = useAuth();
  const { customers, invoices } = useData();

  const existing = useMemo(
    () => (isNew ? null : customers.find((cu) => cu.id === id) ?? null),
    [customers, id, isNew]
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setEmail(existing.email ?? "");
      setPhone(existing.phone ?? "");
      setNotes(existing.notes ?? "");
    }
  }, [existing]);

  const customerInvoices = useMemo(
    () => (isNew ? [] : invoices.filter((i) => i.customerId === id)),
    [invoices, id, isNew]
  );

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter a customer name.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createCustomer(user.uid, {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          notes: notes.trim(),
        });
      } else {
        await updateCustomer(user.uid, id!, {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          notes: notes.trim(),
        });
      }
      router.back();
    } catch (err: any) {
      Alert.alert("Couldn't save", err?.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || isNew) return;
    const ok = await confirm({
      title: "Delete customer",
      message: `Remove ${name || "this customer"}?`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteCustomer(user.uid, id!);
      router.back();
    } catch (err: any) {
      Alert.alert("Couldn't delete", err?.message ?? "Please try again.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader
        title={isNew ? "New customer" : "Edit customer"}
        subtitle={isNew ? "Add a new contact" : "Update contact details"}
        rightIcon="x"
        onRightPress={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label="Name" value={name} onChangeText={setName} placeholder="Acme Corp" />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="hello@acme.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 555 123 4567"
          keyboardType="phone-pad"
        />
        <Input
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything to remember…"
          multiline
          style={{ minHeight: 80, textAlignVertical: "top", paddingTop: 14 }}
        />
        {!isNew && customerInvoices.length > 0 ? (
          <View
            style={[
              styles.summary,
              { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
            ]}
          >
            <Text style={{ color: c.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
              INVOICES
            </Text>
            <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 18, marginTop: 4 }}>
              {customerInvoices.length} total · {customerInvoices.filter((i) => i.status !== "paid").length} unpaid
            </Text>
          </View>
        ) : null}
        <Button
          label={saving ? "Saving…" : isNew ? "Create customer" : "Save changes"}
          icon="check"
          loading={saving}
          onPress={handleSave}
        />
        {!isNew && (
          <Button
            label="Delete customer"
            icon="trash-2"
            variant="destructive"
            onPress={handleDelete}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 60, gap: 14 },
  summary: { padding: 16, borderWidth: 1 },
});
