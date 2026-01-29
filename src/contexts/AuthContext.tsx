import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/database";
import { getProfile, createProfile } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch profile when user signs in
        if (session?.user) {
          setTimeout(async () => {
            try {
              let userProfile = await getProfile(session.user.id);
              if (!userProfile) {
                userProfile = await createProfile(session.user.id, session.user.email?.split('@')[0]);
              }
              setProfile(userProfile);
            } catch (error) {
              console.error('Error fetching profile:', error);
            }
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        getProfile(session.user.id).then(async (userProfile) => {
          if (!userProfile) {
            try {
              userProfile = await createProfile(session.user.id, session.user.email?.split('@')[0]);
            } catch (error) {
              console.error('Error creating profile:', error);
            }
          }
          setProfile(userProfile);
          setLoading(false);
        }).catch(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
