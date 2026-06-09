"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { getUserProfile, saveUserProfile, UserProfile } from "@/lib/db";

interface AuthContextType {
  user: (UserProfile & { email: string | null; displayName: string | null }) | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  completeRegistrationDetails: (name: string, lastName: string, phone: string) => Promise<void>;
  isOnboardingCompleted: boolean;
  setIsOnboardingCompleted: (val: boolean) => void;
  isFirebaseActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_AUTH_STATE_KEY = "mesira_mock_user_session";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);

  // Check if onboarding was completed for this user
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (user) {
        const completed = localStorage.getItem(`mesira_onboarding_completed_${user.uid}`) === "true";
        setIsOnboardingCompleted(completed);
      } else {
        setIsOnboardingCompleted(false);
      }
    }
  }, [user]);

  const handleSetOnboardingCompleted = (val: boolean) => {
    setIsOnboardingCompleted(val);
    if (typeof window !== "undefined" && user) {
      localStorage.setItem(`mesira_onboarding_completed_${user.uid}`, val ? "true" : "false");
    }
  };

  // Listen to Auth State
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setLoading(true);
        if (firebaseUser) {
          // Fetch additional profile from Firestore
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName,
              name: profile.name,
              lastName: profile.lastName,
              phone: profile.phone,
              isPhoneVerified: profile.isPhoneVerified,
              createdAt: profile.createdAt
            });
          } else {
            // First time login - Profile not complete yet
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName,
              name: "",
              lastName: "",
              phone: "",
              isPhoneVerified: false,
              createdAt: new Date()
            });
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Mock Auth State restoration
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(MOCK_AUTH_STATE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      }
      setLoading(false);
    }
  }, []);

  // Sign In with Google
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;
        const profile = await getUserProfile(firebaseUser.uid);
        
        if (profile) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName,
            name: profile.name,
            lastName: profile.lastName,
            phone: profile.phone,
            isPhoneVerified: profile.isPhoneVerified,
            createdAt: profile.createdAt
          });
        } else {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName,
            name: "",
            lastName: "",
            phone: "",
            isPhoneVerified: false,
            createdAt: new Date()
          });
        }
      } else {
        // Mock Login
        const mockUser = {
          uid: "mock-user-current",
          email: "usuario.demo@gmail.com",
          displayName: "Juan Demo",
          name: "",
          lastName: "",
          phone: "",
          isPhoneVerified: false,
          createdAt: Date.now()
        };
        setUser(mockUser);
        localStorage.setItem(MOCK_AUTH_STATE_KEY, JSON.stringify(mockUser));
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign Out
  const logOut = async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        await signOut(auth);
      } else {
        localStorage.removeItem(MOCK_AUTH_STATE_KEY);
        setUser(null);
      }
      handleSetOnboardingCompleted(false);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  // Complete registration fields (marked as verified immediately)
  const completeRegistrationDetails = async (name: string, lastName: string, phone: string) => {
    if (!user) throw new Error("No user is logged in");

    // Save profile to database directly with isPhoneVerified: true
    const finalProfile = await saveUserProfile(user.uid, {
      email: user.email || "",
      name,
      lastName,
      phone,
      isPhoneVerified: true
    });

    const updatedUser = {
      ...user,
      name,
      lastName,
      phone,
      isPhoneVerified: true,
      createdAt: finalProfile.createdAt
    };

    setUser(updatedUser);

    if (!isFirebaseConfigured) {
      localStorage.setItem(MOCK_AUTH_STATE_KEY, JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        logOut,
        completeRegistrationDetails,
        isOnboardingCompleted,
        setIsOnboardingCompleted: handleSetOnboardingCompleted,
        isFirebaseActive: isFirebaseConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
