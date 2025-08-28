'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { 
  Package, 
  Truck, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  Users,
  Settings
} from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  color: string;
}

interface PackageWithProcessing {
  id: string;
  tracking_number: string;
  status: string;
  sender_type: string;
  shipping_date: string;
  priority_level: string;
  expected_arrival_date: string | null;
  processing?: {
    tracking_number_confirmation: string;
    reservation_confirmation: string;
  } | null;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [packages, setPackages] = useState<PackageWithProcessing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatCard[]>([
    {
      title: '総荷物数',
      value: '0',
      change: '',
      icon: <Package className="h-8 w-8" />,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: '配送中',
      value: '0',
      change: '',
      icon: <Truck className="h-8 w-8" />,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      title: '処理待ち',
      value: '0',
      change: '',
      icon: <Settings className="h-8 w-8" />,
      color: 'text-orange-600 bg-orange-100'
    },
    {
      title: '完了',
      value: '0',
      change: '',
      icon: <CheckCircle className="h-8 w-8" />,
      color: 'text-green-600 bg-green-100'
    }
  ]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // ページがフォーカスされた時にデータを更新
  useEffect(() => {
    const handleFocus = () => {
      console.log('Dashboard focused, refreshing data...');
      loadDashboardData();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // パッケージデータと処理状況を並列取得
      console.log('Dashboard: Fetching data in parallel...');
      const [
        { data: packagesData, error: packagesError },
        { data: allProcessingData, error: processingError }
      ] = await Promise.all([
        supabase.from('packages').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('package_processing').select('*')
      ]);
        
      console.log('Dashboard parallel queries result:', { packagesData, packagesError, processingError });
      
      if (packagesError) {
        console.error('Dashboard packages error:', packagesError);
        setPackages([]);
      } else {
        // パッケージと処理データを結合
        const processedPackages = (packagesData || []).map(pkg => {
          const processing = allProcessingData?.find(p => p.package_id === pkg.id) || null;
          return {
            ...pkg,
            processing: processing
          };
        });
        
        console.log('Dashboard: Final processed packages:', processedPackages);
        setPackages(processedPackages);
      }

      // 統計データを計算（既に取得済みのデータを活用）
      console.log('Calculating stats...');
      const { data: allPackages, error: statsError } = await supabase
        .from('packages')
        .select('status');

      console.log('Stats data:', { allPackages, statsError, allProcessingData, processingError });

      if (!statsError && allPackages) {
        const totalCount = allPackages.length;
        const inTransitCount = allPackages.filter(p => 
          ['in_transit_international', 'in_transit_domestic', 'customs_processing'].includes(p.status)
        ).length;
        const arrivedCount = allPackages.filter(p => 
          ['arrived', 'received'].includes(p.status)
        ).length;
        
        let processingPendingCount = 0;
        if (!processingError && allProcessingData) {
          processingPendingCount = allProcessingData.filter(p => 
            p.tracking_number_confirmation === 'not_started' || 
            p.reservation_confirmation === 'not_started'
          ).length;
        }

        setStats([
          {
            title: '総荷物数',
            value: totalCount.toString(),
            change: '',
            icon: <Package className="h-8 w-8" />,
            color: 'text-blue-600 bg-blue-100'
          },
          {
            title: '配送中',
            value: inTransitCount.toString(),
            change: '',
            icon: <Truck className="h-8 w-8" />,
            color: 'text-yellow-600 bg-yellow-100'
          },
          {
            title: '処理待ち',
            value: processingPendingCount.toString(),
            change: '',
            icon: <Settings className="h-8 w-8" />,
            color: 'text-orange-600 bg-orange-100'
          },
          {
            title: '完了',
            value: arrivedCount.toString(),
            change: '',
            icon: <CheckCircle className="h-8 w-8" />,
            color: 'text-green-600 bg-green-100'
          }
        ]);
      }
    } catch (error) {
      console.error('Dashboard data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getSenderTypeLabel = (type: string) => {
    switch (type) {
      case 'china_factory': return '中国工場';
      case 'domestic_manufacturer': return '国内メーカー';
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

  return (
    <ProtectedRoute>
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              ダッシュボード
            </h1>
            <p className="mt-2 text-gray-600">
              ようこそ、{profile?.full_name || profile?.email}さん
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <div className="flex items-baseline">
                      <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                      <p className="ml-2 text-sm font-medium text-green-600">{stat.change}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Packages */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">最近の荷物</h3>
                  <a href="/packages" className="text-sm text-indigo-600 hover:text-indigo-500">
                    すべて表示
                  </a>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="px-6 py-8 text-center">
                    <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">読み込み中...</p>
                  </div>
                ) : packages.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm text-gray-500">荷物がありません</p>
                  </div>
                ) : (
                  packages.map((pkg) => (
                    <a key={pkg.id} href={`/packages/${pkg.id}`} className="block px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {pkg.tracking_number}
                          </p>
                          <p className="text-sm text-gray-500">{pkg.sender_type}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pkg.status)}`}>
                            {getStatusLabel(pkg.status)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(pkg.priority_level)}`}>
                            {getPriorityLabel(pkg.priority_level)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          発送日: {new Date(pkg.shipping_date).toLocaleDateString('ja-JP')}
                        </div>
                        <div className="flex space-x-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getProcessingStatusColor(pkg.processing?.tracking_number_confirmation || 'not_started')}`}>
                            送状: {getProcessingStatusLabel(pkg.processing?.tracking_number_confirmation || 'not_started')}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getProcessingStatusColor(pkg.processing?.reservation_confirmation || 'not_started')}`}>
                            予約: {getProcessingStatusLabel(pkg.processing?.reservation_confirmation || 'not_started')}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">クイックアクション</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  {profile && ['admin', 'editor'].includes(profile.role) && (
                    <a
                      href="/packages/new"
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <Package className="h-8 w-8 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-sm font-medium text-gray-900">新規荷物登録</h4>
                        <p className="text-sm text-gray-500">荷物情報を新規登録</p>
                      </div>
                    </a>
                  )}
                  
                  <a
                    href="/packages"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <Package className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">荷物管理</h4>
                      <p className="text-sm text-gray-500">荷物の確認・編集・ステータス更新</p>
                    </div>
                  </a>
                  
                  {profile && ['admin', 'editor'].includes(profile.role) && (
                    <a
                      href="/documents"
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <FileText className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-sm font-medium text-gray-900">書類管理</h4>
                        <p className="text-sm text-gray-500">納品書・請求書等の管理</p>
                      </div>
                    </a>
                  )}
                  
                  {profile?.role === 'admin' && (
                    <a
                      href="/users"
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <Users className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-sm font-medium text-gray-900">ユーザー管理</h4>
                        <p className="text-sm text-gray-500">ユーザーの追加・編集</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}