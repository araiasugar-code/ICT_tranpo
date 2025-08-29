// シンプルなインメモリキャッシュ
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache: Map<string, CacheItem<any>> = new Map();

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // パターンマッチで複数のキーを削除
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new SimpleCache();

// キャッシュキー生成ユーティリティ
export const CacheKeys = {
  packages: (filters?: any) => `packages:${JSON.stringify(filters || {})}`,
  packageById: (id: string) => `package:${id}`,
  documents: (packageId: string) => `documents:${packageId}`,
  users: () => 'users',
  connection: () => 'connection_status',
} as const;

// キャッシュ付きのデータフェッチ
export async function withCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000 // デフォルト5分
): Promise<T> {
  // キャッシュから取得を試行
  const cached = cache.get<T>(key);
  if (cached !== null) {
    console.log(`Cache hit for key: ${key}`);
    return cached;
  }

  console.log(`Cache miss for key: ${key}, fetching...`);
  
  // キャッシュにない場合は実際にフェッチ
  const data = await fetchFunction();
  
  // キャッシュに保存
  cache.set(key, data, ttlMs);
  
  return data;
}

// データ更新時のキャッシュ無効化ヘルパー
export const invalidateCache = {
  packages: () => {
    cache.invalidatePattern('^packages:');
    console.log('Invalidated packages cache');
  },
  
  packageById: (id: string) => {
    cache.invalidate(CacheKeys.packageById(id));
    cache.invalidatePattern('^packages:'); // リスト表示も更新
    console.log(`Invalidated cache for package: ${id}`);
  },
  
  documents: (packageId: string) => {
    cache.invalidate(CacheKeys.documents(packageId));
    console.log(`Invalidated documents cache for package: ${packageId}`);
  },
  
  users: () => {
    cache.invalidate(CacheKeys.users());
    console.log('Invalidated users cache');
  },
  
  all: () => {
    cache.clear();
    console.log('Cleared all cache');
  },
};