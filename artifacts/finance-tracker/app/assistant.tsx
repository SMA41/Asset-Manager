import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { buildSnapshot, chatWithAI, generateReport } from "@/services/aiService";
import {
  appendChat,
  clearChat,
  saveReport,
  subscribeChat,
  deleteReport,
} from "@/services/firebaseService";
import { ChatMessage } from "@/types";
import { confirm } from "@/utils/confirm";
import { formatCurrency, formatDateTime } from "@/utils/format";

type Tab = "chat" | "reports";

export default function AssistantScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { products, sales, expenses, budgets, reports } = useData();
  const [tab, setTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const snapshot = useMemo(
    () => buildSnapshot({ products, sales, expenses, budgets }),
    [products, sales, expenses, budgets]
  );

  useEffect(() => {
    if (!user) return;
    const u = subscribeChat(user.uid, setMessages);
    return u;
  }, [user]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !user || sending) return;
    setInput("");
    setSending(true);
    try {
      await appendChat(user.uid, { role: "user", content: text });
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const reply = await chatWithAI({
        history,
        userMessage: text,
        snapshot,
      });
      await appendChat(user.uid, { role: "assistant", content: reply });
    } catch (err: any) {
      await appendChat(user.uid, {
        role: "assistant",
        content: `I couldn't reach the assistant: ${err?.message ?? "unknown error"}`,
      });
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = async () => {
    if (!user || messages.length === 0) return;
    const ok = await confirm({
      title: "Clear conversation",
      message: "Delete all messages with the assistant?",
      confirmLabel: "Clear",
      destructive: true,
    });
    if (!ok) return;
    try {
      await clearChat(
        user.uid,
        messages.map((m) => m.id)
      );
    } catch (err: any) {
      Alert.alert("Couldn't clear chat", err?.message ?? "Please try again.");
    }
  };

  const handleGenerateReport = async () => {
    if (!user || generating) return;
    setGenerating(true);
    try {
      const summary = await generateReport(snapshot);
      await saveReport(user.uid, {
        summary,
        period: snapshot.period,
        snapshot,
      });
      setTab("reports");
    } catch (err: any) {
      Alert.alert("Couldn't generate report", err?.message ?? "Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!user) return;
    const ok = await confirm({
      title: "Delete report",
      message: "This report will be removed.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteReport(user.uid, id);
    } catch (err: any) {
      Alert.alert("Couldn't delete report", err?.message ?? "Please try again.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <AppHeader
        showBack
        title="Assistant"
        subtitle="Your AI accountant"
        rightIcon={tab === "chat" ? "trash-2" : "refresh-cw"}
        onRightPress={tab === "chat" ? handleClearChat : handleGenerateReport}
      />

      {/* Tab switcher */}
      <View style={[styles.switcher, { backgroundColor: c.muted, borderRadius: c.radius }]}>
        <SwitcherTab
          label="Chat"
          icon="message-circle"
          active={tab === "chat"}
          onPress={() => setTab("chat")}
        />
        <SwitcherTab
          label="Reports"
          icon="file-text"
          active={tab === "reports"}
          onPress={() => setTab("reports")}
          badge={reports.length > 0 ? String(reports.length) : undefined}
        />
      </View>

      {tab === "chat" ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={listRef}
            data={[...messages].reverse()}
            keyExtractor={(m) => m.id}
            inverted
            contentContainerStyle={[styles.chatList, { paddingTop: 20 }]}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              sending ? (
                <View style={[styles.bubble, styles.botBubble, { backgroundColor: c.card, borderColor: c.border }]}>
                  <ActivityIndicator color={c.primary} size="small" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
                <View
                  style={[
                    styles.welcomeCard,
                    { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
                  ]}
                >
                  <View style={[styles.sparkle, { backgroundColor: c.accent }]}>
                    <Feather name="zap" size={20} color={c.accentForeground} />
                  </View>
                  <Text style={[styles.welcomeTitle, { color: c.foreground }]}>
                    Ask me anything about your business
                  </Text>
                  <Text style={[styles.welcomeBody, { color: c.mutedForeground }]}>
                    I have access to your live revenue, expenses, profit, products and budget.
                  </Text>
                  <View style={{ gap: 8, marginTop: 12 }}>
                    {[
                      "How is my profit this month?",
                      "What's eating my budget?",
                      "Which products are slowing down?",
                      "Generate a full month report",
                    ].map((q) => (
                      <Pressable
                        key={q}
                        onPress={() =>
                          q.startsWith("Generate")
                            ? handleGenerateReport()
                            : setInput(q)
                        }
                        style={({ pressed }) => [
                          styles.suggest,
                          {
                            borderColor: c.border,
                            backgroundColor: pressed ? c.muted : "transparent",
                          },
                        ]}
                      >
                        <Text style={{ color: c.foreground, fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 }}>
                          {q}
                        </Text>
                        <Feather name="arrow-up-right" size={14} color={c.mutedForeground} />
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            }
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubble,
                  item.role === "user" ? styles.userBubble : styles.botBubble,
                  {
                    backgroundColor: item.role === "user" ? c.primary : c.card,
                    borderColor: item.role === "user" ? c.primary : c.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: item.role === "user" ? c.primaryForeground : c.foreground,
                    fontFamily: "Inter_500Medium",
                    fontSize: 14,
                    lineHeight: 20,
                  }}
                >
                  {item.content}
                </Text>
              </View>
            )}
          />

          <View
            style={[
              styles.inputBar,
              {
                backgroundColor: c.background,
                borderTopColor: c.border,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            <View
              style={[
                styles.inputWrap,
                { backgroundColor: c.card, borderColor: c.border, borderRadius: 999 },
              ]}
            >
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask your AI accountant…"
                placeholderTextColor={c.mutedForeground}
                style={{
                  flex: 1,
                  color: c.foreground,
                  fontFamily: "Inter_500Medium",
                  fontSize: 15,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
                multiline
                onSubmitEditing={handleSend}
                returnKeyType="send"
                blurOnSubmit
              />
              <Pressable
                onPress={handleSend}
                disabled={!input.trim() || sending}
                style={({ pressed }) => [
                  styles.sendBtn,
                  {
                    backgroundColor: input.trim() ? c.primary : c.muted,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Feather
                  name="arrow-up"
                  size={18}
                  color={input.trim() ? c.primaryForeground : c.mutedForeground}
                />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 140, gap: 14 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.heroReport,
              { backgroundColor: c.foreground, borderRadius: c.radius + 4 },
            ]}
          >
            <Text style={{ color: c.background, opacity: 0.7, fontFamily: "Inter_500Medium", fontSize: 13 }}>
              Generate a fresh month-end report
            </Text>
            <Text style={{ color: c.background, fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 6 }}>
              Profit so far: {formatCurrency(snapshot.profit)}
            </Text>
            <Text style={{ color: c.background, opacity: 0.7, fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 4 }}>
              Revenue {formatCurrency(snapshot.revenue)} · Expenses {formatCurrency(snapshot.expenses + snapshot.cogs)}
            </Text>
            <View style={{ marginTop: 16 }}>
              <Button
                label={generating ? "Analyzing your books…" : "Generate AI report"}
                icon="zap"
                loading={generating}
                onPress={handleGenerateReport}
              />
            </View>
          </View>

          {reports.length === 0 ? (
            <View
              style={[
                styles.card,
                { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
              ]}
            >
              <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", textAlign: "center" }}>
                Saved reports will appear here.
              </Text>
            </View>
          ) : (
            reports.map((r) => (
              <View
                key={r.id}
                style={[
                  styles.card,
                  { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
                ]}
              >
                <View style={styles.reportHeader}>
                  <View style={[styles.sparkleSm, { backgroundColor: c.accent }]}>
                    <Feather name="zap" size={14} color={c.accentForeground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 15 }}>
                      {r.period} report
                    </Text>
                    <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12 }}>
                      {formatDateTime(r.createdAt)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleDeleteReport(r.id)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 8 })}
                  >
                    <Feather name="trash-2" size={16} color={c.mutedForeground} />
                  </Pressable>
                </View>
                <Text
                  style={{
                    color: c.foreground,
                    fontFamily: "Inter_400Regular",
                    fontSize: 14,
                    lineHeight: 22,
                  }}
                >
                  {r.summary}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function SwitcherTab({
  label,
  icon,
  active,
  onPress,
  badge,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  active: boolean;
  onPress: () => void;
  badge?: string;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.switcherTab,
        {
          backgroundColor: active ? c.background : "transparent",
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Feather name={icon} size={14} color={active ? c.foreground : c.mutedForeground} />
      <Text
        style={{
          color: active ? c.foreground : c.mutedForeground,
          fontFamily: "Inter_600SemiBold",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: c.primary }]}>
          <Text style={{ color: c.primaryForeground, fontFamily: "Inter_700Bold", fontSize: 10 }}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  switcher: {
    flexDirection: "row",
    marginHorizontal: 20,
    padding: 4,
    gap: 4,
    marginBottom: 12,
  },
  switcherTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  chatList: {
    padding: 16,
    gap: 10,
  },
  bubble: {
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 6,
  },
  botBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 6,
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1,
    paddingRight: 4,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
  },
  welcomeCard: {
    padding: 18,
    borderWidth: 1,
    gap: 8,
  },
  sparkle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  sparkleSm: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    letterSpacing: -0.3,
  },
  welcomeBody: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
  },
  suggest: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  heroReport: {
    padding: 22,
  },
  card: {
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
