'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface Package {
  id: string;
  tracking_number: string;
  sender_type: string;
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
  processing?: {
    tracking_number_confirmation: string;
    reservation_confirmation: string;
  } | null;
}

export default function PackagesPage() {
  const { hasRole } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [senderTypeFilter, setSenderTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const loadPackages = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // キャッシュをクリアするためのタイムスタンプを追加
      const timestamp = forceRefresh ? `?t=${Date.now()}` : '';
      
      console.log('Packages list: Building query...');
      let query = supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });
        
      console.log('Packages list: Query built, applying filters...');

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (senderTypeFilter !== 'all') {
        query = query.eq('sender_type', senderTypeFilter);
      }
      if (priorityFilter !== 'all') {
        query = query.eq('priority_level', priorityFilter);
      }
      if (searchTerm) {
        query = query.or(`tracking_number.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        console.log('Packages list: Search filter applied:', searchTerm);
      }

      // 並列でパッケージと処理データを取得
      console.log('Packages list: Executing parallel queries...');
      const [
        { data: packagesData, error: packagesError },
        { data: allProcessingData, error: processingError }
      ] = await Promise.all([
        query,
        supabase.from('package_processing').select('*')
      ]);
      
      if (packagesError) throw packagesError;
      if (processingError) console.warn('Processing data error:', processingError);
      
      console.log('Packages list: Parallel queries completed');
      
      // パッケージと処理データを結合
      const processedPackages = (packagesData || []).map(pkg => {
        const processing = allProcessingData?.find(p => p.package_id === pkg.id) || null;
        return {
          ...pkg,
          processing: processing
        };
      });
      
      setPackages(processedPackages);
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, [searchTerm, statusFilter, senderTypeFilter, priorityFilter]);

  // ページがフォーカスされた時にデータを更新
  useEffect(() => {
    const handleFocus = () => {
      console.log('Page focused, refreshing data...');
      loadPackages(true);
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // キャッシュ無効化をチェック
  useEffect(() => {
    const checkCacheInvalidation = () => {
      const lastInvalidation = localStorage.getItem('packages-cache-invalidate');
      const lastCheck = localStorage.getItem('packages-last-check') || '0';
      
      if (lastInvalidation && lastInvalidation > lastCheck) {
        console.log('Cache invalidated, refreshing...');
        loadPackages(true);
        localStorage.setItem('packages-last-check', Date.now().toString());
      }
    };

    checkCacheInvalidation();
    const interval = setInterval(checkCacheInvalidation, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_transit_international': return 'bg-blue-100 text-blue-800';
      case 'customs_processing': return 'bg-yellow-100 text-yellow-800';
      case 'in_transit_domestic': return 'bg-purple-100 text-purple-800';
      case 'arrived': return 'bg-green-100 text-green-800';
      case 'received': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_transit_international': return '配送中（国際輸送）';
      case 'customs_processing': return '通関手続き中';
      case 'in_transit_domestic': return '配送中（国内）';
      case 'arrived': return '到着済み';
      case 'received': return '受取確認済み';
      default: return '不明';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '不明';
    }
  };


  const getProcessingStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProcessingStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started': return '未着手';
      case 'in_progress': return '作業中';
      case 'completed': return '完了';
      default: return '未設定';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const deletePackage = async (id: string) => {
    if (!confirm('この荷物を削除してもよろしいですか？')) return;
    
    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await loadPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('削除に失敗しました');
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="sm:flex sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">荷物管理</h1>
              <p className="mt-2 text-gray-600">荷物の配送状況を管理します</p>
            </div>
            {hasRole(['admin', 'editor']) && (
              <div className="mt-4 sm:mt-0">
                <Link
                  href="/packages/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新規登録
                </Link>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  検索
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="荷物番号・概要で検索"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ステータス
                </label>
                <select
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">すべて</option>
                  <option value="shipped">発送済み</option>
                  <option value="in_transit_international">配送中（国際輸送）</option>
                  <option value="customs_processing">通関手続き中</option>
                  <option value="in_transit_domestic">配送中（国内）</option>
                  <option value="arrived">到着済み</option>
                  <option value="received">受取確認済み</option>
                </select>
              </div>

              {/* Sender Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  発送元
                </label>
                <select
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={senderTypeFilter}
                  onChange={(e) => setSenderTypeFilter(e.target.value)}
                >
                  <option value="all">すべて</option>
                  <option value="china_factory">中国工場</option>
                  <option value="domestic_manufacturer">国内メーカー</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  重要度
                </label>
                <select
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">すべて</option>
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
            </div>
          </div>

          {/* Package List */}
          <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                読み込み中...
              </div>
            ) : packages.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                荷物が見つかりませんでした
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        荷物番号
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        発送元
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        社内処理
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        重要度
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        発送日
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        予定到着日
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {packages.map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/packages/${pkg.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {pkg.tracking_number}
                          </div>
                          {pkg.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {pkg.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {pkg.sender_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pkg.status)}`}>
                            {getStatusLabel(pkg.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex space-x-1">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getProcessingStatusColor(pkg.processing?.tracking_number_confirmation || 'not_started')}`}>
                                送状: {getProcessingStatusLabel(pkg.processing?.tracking_number_confirmation || 'not_started')}
                              </span>
                            </div>
                            <div className="flex space-x-1">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getProcessingStatusColor(pkg.processing?.reservation_confirmation || 'not_started')}`}>
                                予約: {getProcessingStatusLabel(pkg.processing?.reservation_confirmation || 'not_started')}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(pkg.priority_level)}`}>
                            {getPriorityLabel(pkg.priority_level)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(pkg.shipping_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {pkg.expected_arrival_date ? formatDate(pkg.expected_arrival_date) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                            {hasRole(['admin', 'editor']) && (
                              <Link
                                href={`/packages/${pkg.id}/edit`}
                                className="text-gray-600 hover:text-gray-900"
                                title="編集"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                            )}
                            {hasRole(['admin']) && (
                              <button
                                onClick={() => deletePackage(pkg.id)}
                                className="text-red-600 hover:text-red-900"
                                title="削除"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}