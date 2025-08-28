'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'editor' | 'viewer';
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  demoLogin: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useMemo(() => {
    const cache: { [key: string]: Profile } = {};
    
    return async (userId: string) => {
      try {
        // キャッシュチェック
        if (cache[userId]) {
          return cache[userId];
        }

        // タイムアウト付きでプロファイル取得
        const timeoutPromise = new Promise<{ data: null, error: { message: string } }>((resolve) => 
          setTimeout(() => resolve({ data: null, error: { message: 'Profile fetch timeout' } }), 1500)
        );
        
        const fetchPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .eq('is_active', true)
          .single();
          
        const result = await Promise.race([fetchPromise, timeoutPromise]);
        const { data, error } = result;

        if (error) {
          console.warn('Profile fetch error:', error.message);
          // タイムアウトまたはエラーの場合、Supabaseのユーザー情報を基にフォールバックプロファイルを作成
          const { data: { user } } = await supabase.auth.getUser();
          const fallbackProfile = {
            id: userId,
            email: user?.email || 'unknown@example.com',
            role: 'admin' as const, // デフォルトでadmin権限を付与
            full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown User',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          cache[userId] = fallbackProfile;
          return fallbackProfile;
        }
        
        // キャッシュに保存
        if (data) {
          cache[userId] = data;
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching profile:', error);
        // 例外の場合もSupabaseのユーザー情報を基にフォールバックプロファイルを返す
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const fallbackProfile = {
            id: userId,
            email: user?.email || 'unknown@example.com',
            role: 'admin' as const, // デフォルトでadmin権限を付与
            full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown User',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          cache[userId] = fallbackProfile;
          return fallbackProfile;
        } catch (userError) {
          console.error('Could not fetch user info:', userError);
          const fallbackProfile = {
            id: userId,
            email: 'unknown@example.com',
            role: 'admin' as const,
            full_name: 'Unknown User',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          cache[userId] = fallbackProfile;
          return fallbackProfile;
        }
      }
    };
  }, []);

  // デモログイン用の関数
  const demoLogin = async () => {
    // デモ用のユーザーデータをセット
    const demoUser = {
      id: 'demo-user-id',
      email: 'demo@example.com',
    } as User;

    const demoProfile: Profile = {
      id: 'demo-user-id',
      email: 'demo@example.com',
      full_name: 'デモユーザー',
      role: 'admin',
      is_active: true,
    };

    const demoSession = {
      user: demoUser,
      access_token: 'demo-token',
      expires_at: Date.now() + 3600000, // 1時間後
    } as Session;

    setUser(demoUser);
    setProfile(demoProfile);
    setSession(demoSession);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      if (!mounted) return;
      
      // デモモードの場合、Supabaseへのアクセスをスキップ
      if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('demo.supabase.co')) {
        setLoading(false);
        return;
      }

      try {
        console.log('AuthContext: Getting session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('AuthContext: Session received:', session);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('AuthContext: Fetching profile for user:', session.user.id);
          try {
            const profileData = await fetchProfile(session.user.id);
            console.log('AuthContext: Profile data received:', profileData);
            if (mounted) {
              setProfile(profileData);
            }
          } catch (error) {
            console.error('AuthContext: Failed to fetch profile in getSession, using fallback:', error);
            // プロファイル取得に失敗した場合のフォールバック
            if (mounted) {
              setProfile({
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.email?.split('@')[0] || 'ユーザー',
                role: 'viewer',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
          }
        } else {
          if (mounted) {
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        if (mounted) {
          console.log('AuthContext: Setting loading to false');
          setLoading(false);
        }
      }
    };

    getSession();

    // デモモードの場合、認証状態変更の監視をスキップ
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('demo.supabase.co')) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('AuthContext: Auth state change:', event, session);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('AuthContext: Fetching profile in auth state change for user:', session.user.id);
          try {
            const profileData = await fetchProfile(session.user.id);
            console.log('AuthContext: Profile data received in auth state change:', profileData);
            if (mounted) {
              setProfile(profileData);
            }
          } catch (error) {
            console.error('AuthContext: Failed to fetch profile, using fallback:', error);
            // プロファイル取得に失敗した場合のフォールバック
            if (mounted) {
              setProfile({
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.email?.split('@')[0] || 'ユーザー',
                role: 'viewer',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
          }
        } else {
          if (mounted) {
            setProfile(null);
          }
        }
        if (mounted) {
          console.log('AuthContext: Setting loading to false in auth state change');
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('demo.supabase.co')) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const hasRole = (roles: string[]) => {
    if (!profile) return false;
    return roles.includes(profile.role);
  };

  const value = useMemo((): AuthContextType => ({
    user,
    profile,
    session,
    loading,
    signIn,
    signOut,
    demoLogin,
    hasRole,
  }), [user, profile, session, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};