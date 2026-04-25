import React from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect, Slot, useSegments } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const c = useColors();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.background }}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  const inAuthGroup = segments[0] === "(auth)";

  if (!user && !inAuthGroup) return <Redirect href="/(auth)/login" />;
  if (user && inAuthGroup) return <Redirect href="/(tabs)" />;
  return <Slot />;
}
