'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Package, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Home,
  BarChart3,
  History
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  requiredRoles?: string[];
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, signOut, hasRole } = useAuth();
  const router = useRouter();

  const menuItems: MenuItem[] = [
    {
      icon: <Home className="h-5 w-5" />,
      label: 'ダッシュボード',
      href: '/dashboard',
    },
    {
      icon: <Package className="h-5 w-5" />,
      label: '荷物管理',
      href: '/packages',
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: '書類管理',
      href: '/documents',
      requiredRoles: ['admin', 'editor'],
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: 'レポート',
      href: '/reports',
      requiredRoles: ['admin', 'editor'],
    },
    {
      icon: <History className="h-5 w-5" />,
      label: '操作履歴',
      href: '/audit-logs',
      requiredRoles: ['admin'],
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: 'ユーザー管理',
      href: '/users',
      requiredRoles: ['admin'],
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: 'システム設定',
      href: '/settings',
      requiredRoles: ['admin'],
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'editor': return 'bg-yellow-100 text-yellow-800';
      case 'viewer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '管理者';
      case 'editor': return '編集者';
      case 'viewer': return '閲覧者';
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
                <span className="text-sm font-medium text-white">
                  {profile?.full_name?.charAt(0) || profile?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.full_name || profile?.email}
              </p>
              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(profile?.role || '')}`}>
                {getRoleLabel(profile?.role || '')}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => {
              // Check if user has required role for this menu item
              if (item.requiredRoles && !hasRole(item.requiredRoles)) {
                return null;
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sign out button */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <button
            onClick={handleSignOut}
            className="group flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span className="ml-3">ログアウト</span>
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
          {children}
        </main>
      </div>
    </div>
  );
}