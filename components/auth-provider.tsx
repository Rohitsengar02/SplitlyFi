'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, signOut as fbSignOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
  profile: UserProfile | null;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const mapped: User = {
          uid: fbUser.uid,
          email: fbUser.email ?? '',
          displayName: fbUser.displayName ?? undefined,
          photoURL: fbUser.photoURL ?? undefined,
        };
        setUser(mapped);
        // Set a baseline profile from auth user to avoid blank UI while Firestore loads
        setProfile({
          uid: mapped.uid,
          email: mapped.email,
          displayName: mapped.displayName,
          photoURL: mapped.photoURL,
          bio: '',
        });
        // Try to ensure user doc and subscribe to Firestore profile (best-effort)
        ensureUserDoc(fbUser)
          .then(() => {
            const ref = doc(db, 'users', fbUser.uid);
            return onSnapshot(ref, (snap) => {
              if (snap.exists()) {
                setProfile({ ...(snap.data() as UserProfile) });
              }
            });
          })
          .catch((e) => {
            // If rules block writes/reads, keep baseline profile and continue
            console.error('Firestore profile init failed:', e);
          });
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error('Google sign-in failed:', e);
      throw e;
    }
  };

  const signInWithFacebook = async () => {
    const provider = new FacebookAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error('Facebook sign-in failed:', e);
      throw e;
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  async function ensureUserDoc(fbUser: FirebaseUser) {
    try {
      const ref = doc(db, 'users', fbUser.uid);
      const base: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email ?? '',
        displayName: fbUser.displayName ?? '',
        photoURL: fbUser.photoURL ?? '',
        bio: '',
        // Always set; rules allow transforms and partial updates
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };
      await setDoc(ref, base, { merge: true });
    } catch (e) {
      console.error('Failed to upsert user document:', e);
      // Do not throw; allow UI to continue with baseline profile
    }
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithFacebook, signOut, profile, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}