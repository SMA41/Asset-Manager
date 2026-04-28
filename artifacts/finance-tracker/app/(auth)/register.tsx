import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";

import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function RegisterScreen() {
  const c = useColors();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email.trim() || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      await signUp(name, email, password);
    } catch (err: any) {
      setError(err?.code?.replace?.("auth/", "")?.replace?.(/-/g, " ") ?? err?.message ?? "Sign up failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={styles.container}
      bottomOffset={20}
    >
      <View style={styles.inner}>
      <View style={styles.brand}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={{ width: 64, height: 64, borderRadius: 16 }}
        />
        <Text style={[styles.h1, { color: c.foreground }]}>Create your account</Text>
        <Text style={[styles.h2, { color: c.mutedForeground }]}>
          Track sales, expenses & profit with AI insights
        </Text>
      </View>

      <View style={{ gap: 14 }}>
        <Input
          label="Business name (optional)"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          placeholder="Acme Studio"
        />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          placeholder="At least 6 characters"
          error={error}
        />
        <Button label="Create account" onPress={submit} loading={busy} />
      </View>

      <View style={styles.footer}>
        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium" }}>
          Already have an account?{" "}
        </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable>
            <Text style={{ color: c.primary, fontFamily: "Inter_700Bold" }}>Sign in</Text>
          </Pressable>
        </Link>
      </View>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    width: "100%",
    maxWidth: 420,
    gap: 28,
  },
  brand: { gap: 8, alignItems: "flex-start" },
  h1: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.6,
    marginTop: 12,
  },
  h2: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
