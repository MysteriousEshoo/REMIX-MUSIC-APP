/**
 * AuthContext — Ye file tumhare app ko batati hai ki user login hai ya nahi.
 * 
 * KYUN zaruri hai:
 * - Har screen ko pata hona chahiye ki user kaun hai
 * - Login/Logout state globally manage hoti hai
 * - Supabase ka session (login token) automatically save hota hai
 * 
 * KAISE kaam karta hai:
 * 1. App load hone pe Supabase check karta hai → koi purana session hai?
 * 2. Agar hai toh user directly app mein chala jaata hai (dobara login nahi karna)
 * 3. Agar nahi toh Login screen dikhti hai
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

// Ye type batata hai ki context mein kya data hoga
interface AuthContextType {
  session: Session | null;   // Login session (token, user info)
  user: User | null;         // Sirf user object
  loading: boolean;          // Abhi check ho raha hai ya nahi
  signUp: (email: string, password: string, metadata?: object) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

// Context create karo — default values abhi empty hain
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Ye custom hook hai — koi bhi component use kar sakta hai: const { user } = useAuth();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Ye main provider hai — App ko wrap karna padega isse
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * useEffect — Ye component mount hone pe chalta hai
   * Yahan hum Supabase se check karte hain ki koi purana session hai ya nahi
   */
  useEffect(() => {
    // Pehle existing session check karo
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);   // Loading khatam — ab dikha sakta hai
    });

    /**
     * authStateChange listener — Jab bhi login/logout hoga, ye automatically chalega
     * Ye Supabase ki built-in feature hai
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup — jab component hataye toh listener bhi hat jaye
    return () => subscription.unsubscribe();
  }, []);

  /**
   * signUp — Naya user register karta hai
   * 
   * Supabase automatically:
   * 1. auth.users table mein user daalta hai
   * 2. Verification email bhejta hai (agar email confirm on hai)
   * 3. Session token return karta hai
   */
  const signUp = async (email: string, password: string, metadata?: object) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,   // Additional data like full_name, role
      },
    });
    return { error };
  };

  /**
   * signIn — Existing user login karta hai
   * 
   * Supabase check karta hai:
   * 1. Email exist karti hai?
   * 2. Password sahi hai?
   * 3. Dono sahi hai → session token return karo
   * 4. Galat hai → error return karo
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  /**
   * signOut — User ko logout karta hai
   * Session token delete ho jaata hai
   * App automatically Login screen pe redirect ho jaata hai
   */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
