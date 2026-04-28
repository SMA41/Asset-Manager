import React, { useEffect, useMemo, useState } from "react";
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

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import {
  createInvoice,
  deleteInvoice,
  updateInvoiceStatus,
} from "@/services/firebaseService";
import { generatePaymentReminder } from "@/services/aiService";
import { confirm } from "@/utils/confirm";
import { Invoice, InvoiceItem } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";

type DraftItem = { description: string; quantity: string; unitPrice: string };

function emptyItem(): DraftItem {
  return { description: "", quantity: "1", unitPrice: "0" };
}

function nextNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 900 + 100);
  return `INV-${y}${m}${day}-${rand}`;
}

export default function InvoiceEditScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = !id || id === "new";
  const { user } = useAuth();
  const { customers, invoices } = useData();

  const existing = useMemo(
    () => (isNew ? null : invoices.find((i) => i.id === id) ?? null),
    [invoices, id, isNew]
  );

  const [number, setNumber] = useState(nextNumber());
  const [customerId, setCustomerId] = useState<string>("");
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [taxPct, setTaxPct] = useState("0");
  const [dueDate, setDueDate] = useState(() =>
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (existing) {
      setNumber(existing.number);
      setCustomerId(existing.customerId);
      setItems(
        existing.items.map((it) => ({
          description: it.description,
          quantity: String(it.quantity),
          unitPrice: String(it.unitPrice),
        }))
      );
      const subtotal = existing.subtotal || 1;
      setTaxPct(((existing.tax / subtotal) * 100).toFixed(2));
      setDueDate(new Date(existing.dueDate).toISOString().slice(0, 10));
      setNotes(existing.notes ?? "");
    }
  }, [existing]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (a, it) => a + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
        0
      ),
    [items]
  );
  const taxAmount = useMemo(() => (subtotal * (Number(taxPct) || 0)) / 100, [subtotal, taxPct]);
  const total = subtotal + taxAmount;

  const customer = customers.find((c) => c.id === customerId);

  const handleSave = async () => {
    if (!user) return;
    if (!customerId) {
      Alert.alert("Pick a customer", "Select a customer for this invoice.");
      return;
    }
    const validItems: InvoiceItem[] = items
      .map((it) => ({
        description: it.description.trim(),
        quantity: Number(it.quantity) || 0,
        unitPrice: Number(it.unitPrice) || 0,
      }))
      .filter((it) => it.description && it.quantity > 0);
    if (validItems.length === 0) {
      Alert.alert("Add an item", "Add at least one line item.");
      return;
    }
    const due = new Date(dueDate).getTime();
    if (Number.isNaN(due)) {
      Alert.alert("Invalid date", "Due date is not valid.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createInvoice(user.uid, {
          number,
          customerId,
          customerName: customer?.name ?? "",
          items: validItems,
          subtotal,
          tax: taxAmount,
          total,
          status: "sent",
          issueDate: Date.now(),
          dueDate: due,
          paidAt: null,
          notes: notes.trim(),
        });
      } else if (existing) {
        await updateInvoiceStatus(user.uid, existing.id, existing.status, existing.paidAt ?? null);
      }
      router.back();
    } catch (err: any) {
      Alert.alert("Couldn't save", err?.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!user || !existing) return;
    try {
      await updateInvoiceStatus(user.uid, existing.id, "paid", Date.now());
    } catch (err: any) {
      Alert.alert("Couldn't update", err?.message ?? "Please try again.");
    }
  };

  const handleMarkUnpaid = async () => {
    if (!user || !existing) return;
    try {
      await updateInvoiceStatus(user.uid, existing.id, "sent", null);
    } catch (err: any) {
      Alert.alert("Couldn't update", err?.message ?? "Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!user || !existing) return;
    const ok = await confirm({
      title: "Delete invoice",
      message: `Remove ${existing.number}?`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteInvoice(user.uid, existing.id);
      router.back();
    } catch (err: any) {
      Alert.alert("Couldn't delete", err?.message ?? "Please try again.");
    }
  };

  const handleAIRemind = async () => {
    if (!existing) return;
    setGenerating(true);
    try {
      const reminder = await generatePaymentReminder({
        customerName: existing.customerName,
        invoiceNumber: existing.number,
        amount: existing.total,
        dueDate: existing.dueDate,
        daysLate: Math.max(0, Math.floor((Date.now() - existing.dueDate) / 86400000)),
      });
      Alert.alert("Reminder draft", reminder, [
        { text: "Close", style: "cancel" },
      ]);
    } catch (err: any) {
      Alert.alert("Couldn't generate", err?.message ?? "Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const updateItem = (idx: number, key: keyof DraftItem, value: string) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
  };
  const addItem = () => setItems((p) => [...p, emptyItem()]);
  const removeItem = (idx: number) =>
    setItems((p) => (p.length === 1 ? p : p.filter((_, i) => i !== idx)));

  const isPaid = existing?.status === "paid";
  const overdue = existing && existing.status !== "paid" && existing.dueDate < Date.now();

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader
        title={isNew ? "New invoice" : existing?.number ?? "Invoice"}
        subtitle={isNew ? "Bill a customer" : `Total ${formatCurrency(existing?.total ?? 0)}`}
        rightIcon="x"
        onRightPress={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!isNew && existing ? (
          <View
            style={[
              styles.summary,
              {
                backgroundColor: c.heroBg,
                borderRadius: c.radius + 4,
              },
            ]}
          >
            <Text style={{ color: c.heroForeground, opacity: 0.7, fontFamily: "Inter_500Medium", fontSize: 12 }}>
              {existing.number}
            </Text>
            <Text style={{ color: c.heroForeground, fontFamily: "Inter_700Bold", fontSize: 32, letterSpacing: -0.6, marginTop: 2 }}>
              {formatCurrency(existing.total)}
            </Text>
            <Text style={{ color: c.heroForeground, opacity: 0.8, fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 8 }}>
              {existing.customerName}
            </Text>
            <Text style={{ color: c.heroForeground, opacity: 0.6, fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 }}>
              {isPaid
                ? `Paid ${existing.paidAt ? formatDate(existing.paidAt) : ""}`
                : overdue
                ? `Overdue · was due ${formatDate(existing.dueDate)}`
                : `Due ${formatDate(existing.dueDate)}`}
            </Text>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
              {isPaid ? (
                <Button label="Mark unpaid" icon="rotate-ccw" variant="secondary" onPress={handleMarkUnpaid} />
              ) : (
                <>
                  <Button label="Mark as paid" icon="check" onPress={handleMarkPaid} />
                  <Button
                    label={generating ? "…" : "AI remind"}
                    icon="zap"
                    variant="secondary"
                    loading={generating}
                    onPress={handleAIRemind}
                  />
                </>
              )}
            </View>
          </View>
        ) : null}

        {isNew && (
          <>
            <Input label="Invoice number" value={number} onChangeText={setNumber} />

            <View>
              <Text style={[styles.label, { color: c.mutedForeground }]}>Customer</Text>
              {customers.length === 0 ? (
                <View
                  style={[
                    styles.emptyCustomers,
                    { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
                  ]}
                >
                  <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 8 }}>
                    Add a customer first.
                  </Text>
                  <Button
                    label="New customer"
                    icon="user-plus"
                    onPress={() => router.push("/customer/new")}
                  />
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {customers.map((cu) => (
                    <Pressable
                      key={cu.id}
                      onPress={() => setCustomerId(cu.id)}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          backgroundColor: customerId === cu.id ? c.foreground : c.card,
                          borderColor: customerId === cu.id ? c.foreground : c.border,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: customerId === cu.id ? c.background : c.foreground,
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 13,
                        }}
                      >
                        {cu.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            <View
              style={[
                styles.itemsCard,
                { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
              ]}
            >
              <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 8 }}>
                Line items
              </Text>
              {items.map((it, idx) => (
                <View key={idx} style={{ gap: 8, marginBottom: 12 }}>
                  <Input
                    placeholder="Description"
                    value={it.description}
                    onChangeText={(v) => updateItem(idx, "description", v)}
                  />
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Input
                        placeholder="Qty"
                        value={it.quantity}
                        onChangeText={(v) => updateItem(idx, "quantity", v)}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 2 }}>
                      <Input
                        placeholder="Unit price"
                        prefix="$"
                        value={it.unitPrice}
                        onChangeText={(v) => updateItem(idx, "unitPrice", v)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    {items.length > 1 && (
                      <Pressable
                        onPress={() => removeItem(idx)}
                        style={({ pressed }) => [
                          styles.removeBtn,
                          { borderColor: c.border, opacity: pressed ? 0.7 : 1 },
                        ]}
                      >
                        <Feather name="trash-2" size={16} color={c.danger} />
                      </Pressable>
                    )}
                  </View>
                </View>
              ))}
              <Button
                label="Add line item"
                icon="plus"
                variant="ghost"
                onPress={addItem}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Tax %"
                  value={taxPct}
                  onChangeText={setTaxPct}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Due date"
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>

            <Input
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Payment terms, thank-you message…"
              multiline
              style={{ minHeight: 70, textAlignVertical: "top", paddingTop: 14 }}
            />
          </>
        )}

        {!isNew && existing && (
          <View
            style={[
              styles.itemsCard,
              { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
            ]}
          >
            <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 8 }}>
              Items
            </Text>
            {existing.items.map((it, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.foreground, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                    {it.description}
                  </Text>
                  <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12 }}>
                    {it.quantity} × {formatCurrency(it.unitPrice)}
                  </Text>
                </View>
                <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                  {formatCurrency(it.quantity * it.unitPrice)}
                </Text>
              </View>
            ))}
            {existing.notes ? (
              <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 10 }}>
                {existing.notes}
              </Text>
            ) : null}
          </View>
        )}

        <View
          style={[
            styles.totals,
            { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
          ]}
        >
          <TotalRow label="Subtotal" value={formatCurrency(isNew ? subtotal : existing?.subtotal ?? 0)} />
          <TotalRow label="Tax" value={formatCurrency(isNew ? taxAmount : existing?.tax ?? 0)} />
          <View style={{ height: 1, backgroundColor: c.border, marginVertical: 6 }} />
          <TotalRow
            label="Total"
            value={formatCurrency(isNew ? total : existing?.total ?? 0)}
            bold
          />
        </View>

        {isNew ? (
          <Button
            label={saving ? "Creating…" : "Create invoice"}
            icon="check"
            loading={saving}
            onPress={handleSave}
          />
        ) : (
          <Button
            label="Delete invoice"
            icon="trash-2"
            variant="destructive"
            onPress={handleDelete}
          />
        )}
      </ScrollView>
    </View>
  );
}

function TotalRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
      <Text
        style={{
          color: bold ? c.foreground : c.mutedForeground,
          fontFamily: bold ? "Inter_700Bold" : "Inter_500Medium",
          fontSize: bold ? 16 : 14,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: c.foreground,
          fontFamily: bold ? "Inter_700Bold" : "Inter_600SemiBold",
          fontSize: bold ? 16 : 14,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 60, gap: 14 },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    marginBottom: 8,
  },
  summary: { padding: 22 },
  emptyCustomers: { padding: 16, borderWidth: 1, alignItems: "flex-start", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  itemsCard: { padding: 14, borderWidth: 1 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  removeBtn: {
    width: 52,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  totals: { padding: 16, borderWidth: 1 },
});
