import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );
    } catch (err) {
      console.error('Login Error:', err.code);

      if (err.code === 'auth/network-request-failed') {
        throw new Error('Network issue. Check your internet connection.');
      } else if (err.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password.');
      } else {
        throw new Error(err.message);
      }
    }
  };

  const logout = async () => {
    setUser(null);
    setUserData(null);
    return signOut(auth);
  };

  // Auto logout after user leaves app for 30 seconds
  useEffect(() => {
    let logoutTimer;

    const handleVisibilityChange = () => {
      if (document.hidden && auth.currentUser) {
        logoutTimer = setTimeout(async () => {
          try {
            await signOut(auth);
            setUser(null);
            setUserData(null);
          } catch (error) {
            console.error('Auto logout failed:', error);
          }
        }, 30000);
      } else {
        clearTimeout(logoutTimer);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(logoutTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setAuthLoading(true);

      if (!currentUser) {
        setUser(null);
        setUserData(null);
        setAuthLoading(false);
        return;
      }

      setUser(currentUser);

      try {
        const normalizedEmail = currentUser.email?.trim().toLowerCase();

        if (!normalizedEmail) {
          setUserData(null);
          setAuthLoading(false);
          return;
        }

        const q = query(
          collection(db, 'users'),
          where('email', '==', normalizedEmail)
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const data = docSnap.data();

          setUserData({
            id: docSnap.id,
            ...data,
            email: normalizedEmail,
            role: String(data.role || '').toLowerCase().trim(),
            isActive: data.isActive !== false,
          });
        } else {
          console.warn('No Firestore user profile found');
          setUserData(null);
        }
      } catch (error) {
        console.error('Firestore Error:', error);
        setUserData(null);
      }

      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        authLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}