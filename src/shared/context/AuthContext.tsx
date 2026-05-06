import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  lastname: string | null;
  fullname: string;
  photo: string | null;
  role: string;
  phone: string | null;
  nickname: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      
      if (!authData.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: stakeholder, error } = await supabase
        .from('stakeholders')
        .select('name, lastname, role, image_profile, phone, nickname, email')
        .eq('id', authData.user.id)
        .single();

      if (error || !stakeholder) {
        setUser(null);
      } else {
        const fullname = `${stakeholder.name || ''} ${stakeholder.lastname || ''}`.trim();
        setUser({
          id: authData.user.id,
          email: stakeholder.email || authData.user.email || '',
          name: stakeholder.name || 'Usuario',
          lastname: stakeholder.lastname || null,
          fullname: fullname || 'Usuario',
          photo: stakeholder.image_profile || null,
          role: stakeholder.role,
          phone: stakeholder.phone || null,
          nickname: stakeholder.nickname || null,
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        await fetchUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, fetchUser }}>
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
