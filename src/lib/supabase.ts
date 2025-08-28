import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-key';

// 開発用チェック
if (supabaseUrl.includes('demo.supabase.co') || supabaseAnonKey.includes('demo-key')) {
  console.warn('⚠️ Supabaseの設定がデモ用です。実際のプロジェクトURLとキーを.env.localファイルに設定してください。');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
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