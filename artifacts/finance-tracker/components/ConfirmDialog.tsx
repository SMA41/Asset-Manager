import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";
import { subscribeConfirm, ConfirmRequest } from "@/utils/confirm";

export function ConfirmDialog() {
  const c = useColors();
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  useEffect(() => {
    return subscribeConfirm((req) => setRequest(req));
  }, []);

  const close = (result: boolean) => {
    if (!request) return;
    request.resolve(result);
    setRequest(null);
  };

  if (!request) return null;

  const isDestructive = !!request.destructive;
  const accentColor = isDestructive ? c.destructive : c.primary;
  const accentBg = isDestructive ? c.destructive + "20" : c.accent;
  const accentFg = isDestructive ? c.destructive : c.accentForeground;

  return (
    <Modal
      transparent
      visible
      animationType={Platform.OS === "web" ? "fade" : "fade"}
      onRequestClose={() => close(false)}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={() => close(false)}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.card,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              borderRadius: c.radius + 4,
            },
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: accentBg },
            ]}
          >
            <Feather
              name={isDestructive ? "alert-triangle" : "help-circle"}
              size={26}
              color={accentFg}
            />
          </View>

          <Text style={[styles.title, { color: c.foreground }]}>
            {request.title}
          </Text>

          {request.message ? (
            <Text style={[styles.message, { color: c.mutedForeground }]}>
              {request.message}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Button
              label={request.cancelLabel ?? "Cancel"}
              variant="secondary"
              onPress={() => close(false)}
            />
            <Button
              label={request.confirmLabel ?? "Confirm"}
              variant={isDestructive ? "destructive" : "primary"}
              onPress={() => close(true)}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 19,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  message: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    width: "100%",
  },
});
