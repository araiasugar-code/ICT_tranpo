'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Package } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const { signIn, demoLogin, resetPassword } = useAuth();
  const router = useRouter();

  // デモモードかチェック
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('demo.supabase.co') || false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    
    if (error) {
      setError('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    
    await demoLogin();
    router.push('/dashboard');
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('パスワードリセットにはメールアドレスを入力してください。');
      return;
    }

    setResetLoading(true);
    setError('');
    setResetMessage('');

    const { error } = await resetPassword(email);
    
    if (error) {
      setError('パスワードリセットメールの送信に失敗しました。');
    } else {
      setResetMessage('パスワードリセットメールを送信しました。メールを確認してください。');
    }
    
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* ロゴ・タイトル */}
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
              <Package className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              荷物ステータス管理システム
            </h1>
            <p className="text-gray-600">
              ログインしてシステムにアクセスしてください
            </p>
          </div>

          {/* ログインフォーム */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {resetMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {resetMessage}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                         focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="your-email@company.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                           focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="パスワードを入力"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    ログイン中...
                  </div>
                ) : (
                  'ログイン'
                )}
              </button>
              
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full mr-2"></div>
                    デモログイン中...
                  </div>
                ) : (
                  '🚀 デモモードでログイン（開発用）'
                )}
              </button>

              {isDemoMode && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Package className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        デモモード
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>実際のSupabaseプロジェクト設定なしでシステムを体験できます。</p>
                        <p className="mt-1">本格運用には.env.localファイルの設定が必要です。</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* パスワードリセットリンク */}
            <div className="text-center">
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={resetLoading}
                className="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
              >
                {resetLoading ? 'メール送信中...' : 'パスワードを忘れた方はこちら'}
              </button>
            </div>
          </form>

          {/* フッター */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              システム管理者にお問い合わせください
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}