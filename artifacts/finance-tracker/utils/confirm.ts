import { Alert, Platform } from "react-native";

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export type ConfirmRequest = ConfirmOptions & {
  resolve: (result: boolean) => void;
};

type Listener = (request: ConfirmRequest) => void;

let listener: Listener | null = null;

export function subscribeConfirm(fn: Listener): () => void {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

export function confirm(options: ConfirmOptions): Promise<boolean> {
  if (listener) {
    return new Promise((resolve) => {
      listener!({ ...options, resolve });
    });
  }

  if (Platform.OS === "web") {
    const text = options.message
      ? `${options.title}\n\n${options.message}`
      : options.title;
    const ok = typeof window !== "undefined" && window.confirm(text);
    return Promise.resolve(!!ok);
  }

  return new Promise((resolve) => {
    Alert.alert(options.title, options.message, [
      {
        text: options.cancelLabel ?? "Cancel",
        style: "cancel",
        onPress: () => resolve(false),
      },
      {
        text: options.confirmLabel ?? "Confirm",
        style: options.destructive ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ]);
  });
}
