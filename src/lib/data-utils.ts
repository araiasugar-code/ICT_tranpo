import { supabase } from './supabase';
import { withCache, CacheKeys, cache } from './cache-utils';

// タイムアウト付きのデータフェッチユーティリティ
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 15000,
  errorMessage: string = 'リクエストがタイムアウトしました'
): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

// リトライ機能付きデータフェッチ
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = 2,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= retries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (i === retries) {
        throw lastError;
      }

      // エラーの種類に応じてリトライするかどうか判断
      if (lastError.message.includes('timeout') || 
          lastError.message.includes('network') ||
          lastError.message.includes('fetch')) {
        console.warn(`リトライ ${i + 1}/${retries}: ${lastError.message}`);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      } else {
        // リトライ不要なエラー（認証エラー等）
        throw lastError;
      }
    }
  }

  throw lastError!;
}

// パッケージ一覧の取得（キャッシュ・タイムアウト・リトライ付き）
export async function fetchPackages(filters?: any) {
  const cacheKey = CacheKeys.packages(filters);
  
  return withCache(
    cacheKey,
    () => withRetry(
      () => withTimeout(
        supabase
          .from('packages')
          .select(`
            id,
            tracking_number,
            sender_type,
            shipping_date,
            expected_arrival_date,
            description,
            priority_level,
            status,
            created_at,
            updated_at,
            package_processing (
              tracking_number_confirmation,
              reservation_confirmation,
              assigned_to,
              due_date
            )
          `)
          .order('created_at', { ascending: false })
          .limit(50), // パフォーマンス向上のため最大50件に制限
        8000, // タイムアウトを8秒に短縮
        'パッケージデータの取得がタイムアウトしました'
      ),
      3 // リトライ回数を3回に増加
    ),
    3 * 60 * 1000 // 3分間キャッシュ
  );
}

// 特定パッケージの取得（タイムアウト・リトライ付き）
export async function fetchPackageById(id: string) {
  return withRetry(
    () => withTimeout(
      supabase
        .from('packages')
        .select(`
          *,
          package_processing (
            tracking_number_confirmation,
            reservation_confirmation,
            assigned_to,
            due_date
          )
        `)
        .eq('id', id)
        .single(),
      8000,
      'パッケージ詳細の取得がタイムアウトしました'
    ),
    2
  );
}

// ユーザー一覧の取得（タイムアウト・リトライ付き）
export async function fetchUsers() {
  return withRetry(
    () => withTimeout(
      supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false }),
      8000,
      'ユーザーデータの取得がタイムアウトしました'
    ),
    2
  );
}

// ドキュメント一覧の取得（タイムアウト・リトライ付き）
export async function fetchDocumentsByPackageId(packageId: string) {
  return withRetry(
    () => withTimeout(
      supabase
        .from('documents')
        .select('*')
        .eq('package_id', packageId)
        .order('uploaded_at', { ascending: false }),
      8000,
      'ドキュメントデータの取得がタイムアウトしました'
    ),
    2
  );
}

// 接続状態をチェック
export async function checkConnection(): Promise<boolean> {
  try {
    await withTimeout(
      supabase.from('packages').select('id').limit(1),
      5000,
      '接続チェックがタイムアウトしました'
    );
    return true;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
}

// エラーメッセージの正規化
export function normalizeErrorMessage(error: any): string {
  if (error?.message?.includes('timeout')) {
    return '通信がタイムアウトしました。しばらく待ってから再試行してください。';
  }
  
  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
  }
  
  if (error?.code === 'PGRST116') {
    return 'データが見つかりませんでした。';
  }
  
  if (error?.code === 'PGRST301') {
    return 'アクセス権限がありません。';
  }
  
  return error?.message || '不明なエラーが発生しました。';
}