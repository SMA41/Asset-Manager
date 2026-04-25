import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

export function Input({
  label,
  error,
  prefix,
  style,
  ...rest
}: TextInputProps & {
  label?: string;
  error?: string | null;
  prefix?: string;
}) {
  const c = useColors();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label && (
        <Text style={[styles.label, { color: c.mutedForeground }]}>{label}</Text>
      )}
      <View
        style={[
          styles.field,
          {
            backgroundColor: c.muted,
            borderColor: error ? c.destructive : focused ? c.primary : c.border,
            borderRadius: c.radius,
            borderWidth: focused ? 1.5 : 1,
          },
        ]}
      >
        {prefix ? (
          <Text style={[styles.prefix, { color: c.mutedForeground }]}>{prefix}</Text>
        ) : null}
        <TextInput
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={c.mutedForeground}
          style={[
            styles.input,
            { color: c.foreground, fontFamily: "Inter_500Medium" },
            style,
          ]}
        />
      </View>
      {error ? (
        <Text style={[styles.error, { color: c.destructive }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    letterSpacing: 0.2,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    minHeight: 52,
    borderWidth: 1,
  },
  prefix: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  error: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
});
