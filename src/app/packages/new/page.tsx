'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import FileUpload from '@/components/FileUpload';
import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PackageFormData {
  tracking_number: string;
  sender_type: string;
  shipping_date: string;
  expected_arrival_date: string;
  description: string;
  notes: string;
  priority_level: 'high' | 'medium' | 'low';
}

interface UploadedFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  document_type: string;
  uploaded_at: string;
}

export default function NewPackagePage() {
  console.log('NewPackagePage component loading...');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [formData, setFormData] = useState<PackageFormData>({
    tracking_number: '',
    sender_type: '',
    shipping_date: '',
    expected_arrival_date: '',
    description: '',
    notes: '',
    priority_level: 'medium',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    console.log('Submitting package data:', formData);
    console.log('User:', user);
    
    try {
      const packageData = {
        ...formData,
        expected_arrival_date: formData.expected_arrival_date || null,
        description: formData.description || null,
        notes: formData.notes || null,
        created_by: user.id,
        updated_by: user.id,
      };
      
      console.log('Package data to insert:', packageData);
      
      const { data, error } = await supabase
        .from('packages')
        .insert(packageData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('Package inserted successfully:', data);

      // アップロードされたファイルがある場合、package_idを更新
      if (uploadedFiles.length > 0) {
        const fileIds = uploadedFiles.map(f => f.id);
        await supabase
          .from('documents')
          .update({ package_id: data.id })
          .in('id', fileIds);
      }

      router.push(`/packages/${data.id}`);
    } catch (error) {
      console.error('Error creating package:', error);
      const errorMessage = error.message || '不明なエラーが発生しました';
      alert(`荷物の登録に失敗しました: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (file: UploadedFile) => {
    setUploadedFiles(prev => [file, ...prev]);
  };

  console.log('NewPackagePage render:', { user, authLoading, loading });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">認証確認中...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['admin', 'editor']}>
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: '荷物管理', href: '/packages' },
              { label: '新規登録' }
            ]}
          />

          {/* Header */}
          <div className="mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">新規荷物登録</h1>
              <p className="mt-2 text-gray-600">荷物情報を入力してください</p>
            </div>
          </div>

          {/* Form */}
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white shadow-sm border rounded-lg p-6 space-y-6">
              {/* Tracking Number */}
              <div>
                <label htmlFor="tracking_number" className="block text-sm font-medium text-gray-700 mb-2">
                  荷物番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="tracking_number"
                  name="tracking_number"
                  required
                  value={formData.tracking_number}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="例: CN001234567890"
                />
              </div>

              {/* Sender Type */}
              <div>
                <label htmlFor="sender_type" className="block text-sm font-medium text-gray-700 mb-2">
                  発送元 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="sender_type"
                  name="sender_type"
                  required
                  value={formData.sender_type}
                  onChange={handleChange}
                  placeholder="例: 中国工場、国内メーカー、○○株式会社など"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="shipping_date" className="block text-sm font-medium text-gray-700 mb-2">
                    発送日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="shipping_date"
                    name="shipping_date"
                    required
                    value={formData.shipping_date}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="expected_arrival_date" className="block text-sm font-medium text-gray-700 mb-2">
                    予定到着日
                  </label>
                  <input
                    type="date"
                    id="expected_arrival_date"
                    name="expected_arrival_date"
                    value={formData.expected_arrival_date}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Priority Level */}
              <div>
                <label htmlFor="priority_level" className="block text-sm font-medium text-gray-700 mb-2">
                  重要度
                </label>
                <select
                  id="priority_level"
                  name="priority_level"
                  value={formData.priority_level}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  荷物概要
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="例: 電子部品セット A"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  備考
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-vertical"
                  placeholder="特記事項があれば入力してください"
                />
              </div>

              {/* File Upload Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">関連書類（任意）</h3>
                <FileUpload
                  packageId="temp-package"
                  onUploadComplete={handleFileUpload}
                  existingFiles={uploadedFiles}
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <Link
                  href="/packages"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  キャンセル
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      登録中...
                    </div>
                  ) : (
                    '登録'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}