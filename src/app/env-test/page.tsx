'use client';

export default function EnvTest() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">🔧 環境変数テスト</h1>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold">Supabase URL:</h3>
            <p className="font-mono text-sm break-all">
              {supabaseUrl || '❌ 未設定'}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold">Supabase Anon Key:</h3>
            <p className="font-mono text-sm break-all">
              {supabaseKey ? `✅ 設定済み (${supabaseKey.substring(0, 20)}...)` : '❌ 未設定'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold">実行環境:</h3>
            <p className="font-mono text-sm">
              {typeof window !== 'undefined' ? '🌐 ブラウザ' : '🖥️ サーバー'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}