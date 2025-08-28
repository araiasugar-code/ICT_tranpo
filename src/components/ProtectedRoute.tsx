'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRoles = [],
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // ローディング中は何もしない

    if (!user) {
      router.replace(redirectTo);
      return;
    }

    if (!profile) {
      // プロファイルが取得できない場合は少し待つ
      return;
    }

    if (!profile.is_active) {
      router.replace('/unauthorized');
      return;
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(profile.role)) {
      router.replace('/unauthorized');
      return;
    }
  }, [user, profile, loading, router, redirectTo, requiredRoles]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">プロファイルが見つかりません</h1>
          <p className="text-gray-600">システム管理者にお問い合わせください</p>
        </div>
      </div>
    );
  }

  if (!profile.is_active) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">アカウントが無効です</h1>
          <p className="text-gray-600">アカウントが無効化されています。システム管理者にお問い合わせください。</p>
        </div>
      </div>
    );
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">アクセス権限がありません</h1>
          <p className="text-gray-600">この機能を利用する権限がありません。</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}