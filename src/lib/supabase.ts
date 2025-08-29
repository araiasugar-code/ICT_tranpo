import { createClient } from '@supabase/supabase-js';

// 環境変数の厳密チェック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase環境変数が設定されていません');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
}

// デフォルト値で初期化（エラー防止）
const url = supabaseUrl || 'https://demo.supabase.co';
const key = supabaseAnonKey || 'demo-key';

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        // 30秒タイムアウト
        signal: AbortSignal.timeout(30000),
      });
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    timeout: 30000, // リアルタイム接続のタイムアウト
  },
});

export type Database = {
  public: {
    Tables: {
      packages: {
        Row: {
          id: string;
          tracking_number: string;
          sender_type: 'china_factory' | 'domestic_manufacturer';
          shipping_date: string;
          expected_arrival_date: string | null;
          description: string | null;
          notes: string | null;
          priority_level: 'high' | 'medium' | 'low';
          status: 'shipped' | 'in_transit_international' | 'customs_processing' | 'in_transit_domestic' | 'arrived' | 'received';
          created_at: string;
          updated_at: string;
          created_by: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          tracking_number: string;
          sender_type: 'china_factory' | 'domestic_manufacturer';
          shipping_date: string;
          expected_arrival_date?: string | null;
          description?: string | null;
          notes?: string | null;
          priority_level?: 'high' | 'medium' | 'low';
          status?: 'shipped' | 'in_transit_international' | 'customs_processing' | 'in_transit_domestic' | 'arrived' | 'received';
          created_by: string;
          updated_by: string;
        };
        Update: {
          id?: string;
          tracking_number?: string;
          sender_type?: 'china_factory' | 'domestic_manufacturer';
          shipping_date?: string;
          expected_arrival_date?: string | null;
          description?: string | null;
          notes?: string | null;
          priority_level?: 'high' | 'medium' | 'low';
          status?: 'shipped' | 'in_transit_international' | 'customs_processing' | 'in_transit_domestic' | 'arrived' | 'received';
          updated_by?: string;
        };
      };
      package_processing: {
        Row: {
          id: string;
          package_id: string;
          tracking_number_confirmation: 'not_started' | 'in_progress' | 'completed';
          reservation_confirmation: 'not_started' | 'in_progress' | 'completed';
          assigned_to: string | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          package_id: string;
          tracking_number_confirmation?: 'not_started' | 'in_progress' | 'completed';
          reservation_confirmation?: 'not_started' | 'in_progress' | 'completed';
          assigned_to?: string | null;
          due_date?: string | null;
        };
        Update: {
          id?: string;
          package_id?: string;
          tracking_number_confirmation?: 'not_started' | 'in_progress' | 'completed';
          reservation_confirmation?: 'not_started' | 'in_progress' | 'completed';
          assigned_to?: string | null;
          due_date?: string | null;
        };
      };
    };
  };
};