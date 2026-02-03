import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, GoogleAuthProvider } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";

export type UserRole = "user" | "admin";

interface UserProfile {
  role: UserRole;
  email?: string;
  displayName?: string;
  createdAt?: { seconds: number };
}

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser ?? null);
      if (!firebaseUser) {
        setRole(null);
        setLoading(false);
        return;
      }
      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data() as UserProfile;
          setRole(data.role === "admin" ? "admin" : "user");
        } else {
          const newUserData: Record<string, unknown> = {
            role: "user",
            createdAt: serverTimestamp(),
          };
          if (firebaseUser.email != null && firebaseUser.email !== "") {
            newUserData.email = firebaseUser.email;
          }
          if (firebaseUser.displayName != null && firebaseUser.displayName !== "") {
            newUserData.displayName = firebaseUser.displayName;
          }
          await setDoc(userRef, newUserData);
          setRole("user");
        }
      } catch (err) {
        console.error("Auth: failed to create or read user doc", err);
        setRole("user");
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      // Use popup instead of redirect to avoid page refreshes and keep console logs
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Auth: Google sign-in failed", error);
      // Don't throw the error, just log it so the page doesn't crash or refresh
      toast({
        title: "Sign-in failed",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const defaultAuthState: AuthContextType = {
  user: null,
  role: null,
  loading: true,
  signInWithGoogle: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
      console.warn("useAuth called outside AuthProvider (e.g. during HMR). Using default state.");
    }
    return defaultAuthState;
  }
  return context;
}
