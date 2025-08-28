'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestDB() {
  const [result, setResult] = useState<string>('テスト未実行');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult('接続テスト中...');
    
    try {
      // 1. Supabase接続テスト
      const { data: authData, error: authError } = await supabase.auth.getSession();
      console.log('Auth test:', { authData, authError });
      
      // 2. 基本的なクエリテスト
      const { data: testData, error: testError } = await supabase
        .from('packages')
        .select('id')
        .limit(1);
      
      if (testError) {
        setResult(`❌ DB接続エラー: ${testError.message}`);
        return;
      }
      
      // 3. 環境変数チェック
      const envCheck = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌',
      };
      
      setResult(`
✅ DB接続成功!
📊 クエリ結果: ${testData?.length || 0} 件
🔑 環境変数:
  - SUPABASE_URL: ${envCheck.supabaseUrl}
  - SUPABASE_KEY: ${envCheck.supabaseKey}
🌐 URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'undefined'}
      `.trim());
      
    } catch (error) {
      setResult(`❌ 接続エラー: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">🔧 Supabase接続テスト</h1>
        
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-6"
        >
          {loading ? '⏳ テスト中...' : '🚀 接続テスト実行'}
        </button>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">結果:</h2>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
        
        <div className="mt-6 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">📝 チェック項目:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Supabase URL設定</li>
            <li>Supabase匿名キー設定</li>
            <li>packages テーブルへのアクセス</li>
            <li>認証状態の確認</li>
          </ul>
        </div>
      </div>
    </div>
  );
}