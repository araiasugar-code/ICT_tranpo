'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import { supabase } from '@/lib/supabase';
import { 
  History, 
  User, 
  Package, 
  Edit, 
  Plus, 
  Trash2,
  FileText,
  Search,
  Filter
} from 'lucide-react';

interface AuditLog {
  id: string;
  table_name: string;
  operation: string;
  old_data: any;
  new_data: any;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableFilter, setTableFilter] = useState('all');
  const [operationFilter, setOperationFilter] = useState('all');

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (tableFilter !== 'all') {
        query = query.eq('table_name', tableFilter);
      }
      if (operationFilter !== 'all') {
        query = query.eq('operation', operationFilter);
      }
      if (searchTerm) {
        query = query.or(`user_id.ilike.%${searchTerm}%,table_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading audit logs:', error);
      } else {
        setAuditLogs(data || []);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [searchTerm, tableFilter, operationFilter]);

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT': return <Plus className="h-4 w-4 text-green-500" />;
      case 'UPDATE': return <Edit className="h-4 w-4 text-blue-500" />;
      case 'DELETE': return <Trash2 className="h-4 w-4 text-red-500" />;
      default: return <History className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOperationLabel = (operation: string) => {
    switch (operation) {
      case 'INSERT': return '作成';
      case 'UPDATE': return '更新';
      case 'DELETE': return '削除';
      default: return operation;
    }
  };

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case 'packages': return <Package className="h-4 w-4 text-indigo-500" />;
      case 'documents': return <FileText className="h-4 w-4 text-purple-500" />;
      case 'profiles': return <User className="h-4 w-4 text-green-500" />;
      default: return <History className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTableLabel = (tableName: string) => {
    switch (tableName) {
      case 'packages': return '荷物';
      case 'package_processing': return '処理状況';
      case 'documents': return '書類';
      case 'profiles': return 'ユーザー';
      case 'package_status_history': return 'ステータス履歴';
      default: return tableName;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const formatData = (data: any) => {
    if (!data) return '空';
    const keys = Object.keys(data);
    if (keys.length <= 3) {
      return keys.map(key => `${key}: ${data[key]}`).join(', ');
    }
    return `${keys.slice(0, 3).map(key => `${key}: ${data[key]}`).join(', ')}...`;
  };

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb items={[{ label: '操作履歴' }]} />
          
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">操作履歴</h1>
            <p className="mt-2 text-gray-600">システムの操作履歴を確認します</p>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">検索</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="ユーザーIDやテーブル名で検索"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Table Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">テーブル</label>
                <select
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={tableFilter}
                  onChange={(e) => setTableFilter(e.target.value)}
                >
                  <option value="all">すべて</option>
                  <option value="packages">荷物</option>
                  <option value="package_processing">処理状況</option>
                  <option value="documents">書類</option>
                  <option value="profiles">ユーザー</option>
                </select>
              </div>

              {/* Operation Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">操作</label>
                <select
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={operationFilter}
                  onChange={(e) => setOperationFilter(e.target.value)}
                >
                  <option value="all">すべて</option>
                  <option value="INSERT">作成</option>
                  <option value="UPDATE">更新</option>
                  <option value="DELETE">削除</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Logs List */}
          <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                読み込み中...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                操作履歴が見つかりませんでした
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        日時
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ユーザー
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        テーブル
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        変更内容
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {log.profiles?.full_name || log.profiles?.email || log.user_id}
                              </div>
                              {log.profiles?.full_name && (
                                <div className="text-sm text-gray-500">{log.profiles.email}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getOperationIcon(log.operation)}
                            <span className="ml-2 text-sm text-gray-900">
                              {getOperationLabel(log.operation)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getTableIcon(log.table_name)}
                            <span className="ml-2 text-sm text-gray-900">
                              {getTableLabel(log.table_name)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="max-w-xs truncate">
                            {log.operation === 'INSERT' && (
                              <span className="text-green-600">新規: {formatData(log.new_data)}</span>
                            )}
                            {log.operation === 'UPDATE' && (
                              <span className="text-blue-600">変更: {formatData(log.new_data)}</span>
                            )}
                            {log.operation === 'DELETE' && (
                              <span className="text-red-600">削除: {formatData(log.old_data)}</span>
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