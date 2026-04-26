import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "./AuthContext";
import { Plan, UserProfile } from "@/types";

type PlanContextValue = {
  plan: Plan;
  profile: UserProfile | null;
  loading: boolean;
  upgrade: () => Promise<void>;
  downgrade: () => Promise<void>;
  isPro: boolean;
};

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

function profileRef(uid: string) {
  return doc(db, "users", uid, "profile", "info");
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = profileRef(user.uid);
    getDoc(ref)
      .then((snap) => {
        if (!snap.exists()) {
          return setDoc(ref, { plan: "free", createdAt: serverTimestamp() });
        }
      })
      .catch(() => {});

    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data();
      setProfile({
        plan: (data?.plan as Plan) ?? "free",
        upgradedAt: data?.upgradedAt?.toMillis?.() ?? null,
        businessName: data?.businessName ?? "",
      });
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const value = useMemo<PlanContextValue>(() => {
    const plan: Plan = profile?.plan ?? "free";
    return {
      plan,
      profile,
      loading,
      isPro: plan === "pro",
      async upgrade() {
        if (!user) return;
        await setDoc(
          profileRef(user.uid),
          { plan: "pro", upgradedAt: serverTimestamp() },
          { merge: true }
        );
      },
      async downgrade() {
        if (!user) return;
        await setDoc(
          profileRef(user.uid),
          { plan: "free", upgradedAt: null },
          { merge: true }
        );
      },
    };
  }, [user, profile, loading]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}
