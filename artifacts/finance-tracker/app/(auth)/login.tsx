import React, { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link } from "expo-router";

import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const c = useColors();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(prettyAuthError(err));
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
          <Text style={[styles.h1, { color: c.foreground }]}>Welcome back</Text>
          <Text style={[styles.h2, { color: c.mutedForeground }]}>
            Sign in to your AI accountant
          </Text>
        </View>

        <View style={{ gap: 14 }}>
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
            autoComplete="password"
            textContentType="password"
            placeholder="••••••••"
            error={error}
          />
          <Button label="Sign in" onPress={submit} loading={busy} />
        </View>

        <View style={styles.footer}>
          <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium" }}>
            New here?{" "}
          </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text style={{ color: c.primary, fontFamily: "Inter_700Bold" }}>
                Create an account
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

function prettyAuthError(err: any): string {
  const code = err?.code as string | undefined;
  if (!code) return err?.message ?? "Could not sign in.";
  if (code.includes("invalid-credential")) return "Wrong email or password.";
  if (code.includes("user-not-found")) return "No account with that email.";
  if (code.includes("wrong-password")) return "Incorrect password.";
  if (code.includes("invalid-email")) return "That email looks invalid.";
  if (code.includes("too-many-requests")) return "Too many attempts. Try again soon.";
  if (code.includes("network")) return "Network error. Check your connection.";
  return code.replace("auth/", "").replace(/-/g, " ");
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
    gap: 32,
  },
  brand: { gap: 8, alignItems: "flex-start" },
  h1: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
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
