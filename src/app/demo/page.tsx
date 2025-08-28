'use client';

import { Package, Users, FileText, Settings, LogOut, Menu, X, Home, BarChart3, History } from 'lucide-react';
import { useState } from 'react';

export default function DemoPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Demo data
  const stats = [
    {
      title: '総荷物数',
      value: '156',
      change: '+12.5%',
      icon: <Package className="h-8 w-8" />,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: '配送中',
      value: '23',
      change: '+5.2%',
      icon: <Package className="h-8 w-8" />,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      title: '要注意',
      value: '4',
      change: '-2.1%',
      icon: <Package className="h-8 w-8" />,
      color: 'text-red-600 bg-red-100'
    },
    {
      title: '完了',
      value: '129',
      change: '+8.7%',
      icon: <Package className="h-8 w-8" />,
      color: 'text-green-600 bg-green-100'
    }
  ];

  const recentPackages = [
    {
      id: '1',
      trackingNumber: 'CN001234567890',
      status: '配送中（国際輸送）',
      senderType: '中国工場',
      shippingDate: '2024-01-15',
      priority: 'high'
    },
    {
      id: '2',
      trackingNumber: 'JP987654321012',
      status: '到着済み',
      senderType: '国内メーカー',
      shippingDate: '2024-01-16',
      priority: 'medium'
    },
    {
      id: '3',
      trackingNumber: 'CN567890123456',
      status: '通関手続き中',
      senderType: '中国工場',
      shippingDate: '2024-01-17',
      priority: 'low'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case '発送済み': return 'bg-gray-100 text-gray-800';
      case '配送中（国際輸送）': return 'bg-blue-100 text-blue-800';
      case '通関手続き中': return 'bg-yellow-100 text-yellow-800';
      case '配送中（国内）': return 'bg-purple-100 text-purple-800';
      case '到着済み': return 'bg-green-100 text-green-800';
      case '受取確認済み': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 bg-indigo-600">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-white" />
            <span className="ml-2 text-lg font-semibold text-white">荷物管理</span>
          </div>
          <button
            className="lg:hidden text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">D</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 truncate">デモユーザー</p>
              <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                管理者
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium text-gray-900 rounded-md bg-gray-100">
              <Home className="h-5 w-5 mr-3" />
              ダッシュボード
            </a>
            <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50">
              <Package className="h-5 w-5 mr-3" />
              荷物管理
            </a>
            <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50">
              <FileText className="h-5 w-5 mr-3" />
              書類管理
            </a>
            <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50">
              <BarChart3 className="h-5 w-5 mr-3" />
              レポート
            </a>
            <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50">
              <History className="h-5 w-5 mr-3" />
              操作履歴
            </a>
            <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50">
              <Users className="h-5 w-5 mr-3" />
              ユーザー管理
            </a>
            <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50">
              <Settings className="h-5 w-5 mr-3" />
              システム設定
            </a>
          </div>
        </nav>

        {/* Demo notice */}
        <div className="absolute bottom-20 left-0 right-0 p-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-xs text-yellow-800 font-medium">🚧 デモモード</p>
            <p className="text-xs text-yellow-600 mt-1">
              Supabaseの設定を行うと実際の機能が利用できます
            </p>
          </div>
        </div>

        {/* Sign out button */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <button className="group flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:text-red-700 hover:bg-red-50">
            <LogOut className="h-5 w-5 mr-3" />
            ログアウト
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b">
          <div className="px-4 h-16 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <Package className="h-6 w-6 text-indigo-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">荷物管理</span>
            </div>
            <div /> {/* Spacer */}
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                ダッシュボード
              </h1>
              <p className="mt-2 text-gray-600">
                ようこそ、デモユーザーさん
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
                    <a href="#" className="text-sm text-indigo-600 hover:text-indigo-500">
                      すべて表示
                    </a>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {recentPackages.map((pkg) => (
                    <div key={pkg.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {pkg.trackingNumber}
                          </p>
                          <p className="text-sm text-gray-500">{pkg.senderType}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pkg.status)}`}>
                            {pkg.status}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(pkg.priority)}`}>
                            {getPriorityLabel(pkg.priority)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <Package className="h-4 w-4 mr-1" />
                        発送日: {pkg.shippingDate}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">クイックアクション</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-4">
                    <a
                      href="#"
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
                    
                    <a
                      href="#"
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <BarChart3 className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-sm font-medium text-gray-900">ステータス更新</h4>
                        <p className="text-sm text-gray-500">荷物のステータスを更新</p>
                      </div>
                    </a>
                    
                    <a
                      href="#"
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
                    
                    <a
                      href="#"
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}