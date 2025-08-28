'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import { FileText, Upload } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'editor']}>
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb items={[{ label: '書類管理' }]} />
          
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">書類管理</h1>
            <p className="mt-2 text-gray-600">荷物に関連する書類を管理します</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">書類管理機能</h3>
            <p className="text-gray-600 mb-6">
              この機能は現在開発中です。荷物詳細ページから書類をアップロードできるように実装予定です。
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>実装予定機能:</strong><br />
                • 納品書・請求書のアップロード<br />
                • PDF・画像ファイルの管理<br />
                • 荷物との紐付け<br />
                • ファイルプレビュー
              </p>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}