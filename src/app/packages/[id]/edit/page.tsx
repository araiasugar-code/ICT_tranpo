'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';
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
}

interface PackageFormData {
  tracking_number: string;
  sender_type: string;
  shipping_date: string;
  expected_arrival_date: string;
  description: string;
  notes: string;
  priority_level: 'high' | 'medium' | 'low';
  status: 'shipped' | 'in_transit_international' | 'customs_processing' | 'in_transit_domestic' | 'arrived' | 'received';
}

export default function EditPackagePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalPackage, setOriginalPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState<PackageFormData>({
    tracking_number: '',
    sender_type: 'china_factory',
    shipping_date: '',
    expected_arrival_date: '',
    description: '',
    notes: '',
    priority_level: 'medium',
    status: 'shipped',
  });
  const [statusNote, setStatusNote] = useState('');

  const packageId = params.id as string;

  const loadPackage = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single();

      if (error) throw error;

      setOriginalPackage(data);
      setFormData({
        tracking_number: data.tracking_number,
        sender_type: data.sender_type,
        shipping_date: data.shipping_date,
        expected_arrival_date: data.expected_arrival_date || '',
        description: data.description || '',
        notes: data.notes || '',
        priority_level: data.priority_level,
        status: data.status,
      });
    } catch (error) {
      console.error('Error loading package:', error);
      router.push('/packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (packageId) {
      loadPackage();
    }
  }, [packageId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !originalPackage) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('packages')
        .update({
          ...formData,
          expected_arrival_date: formData.expected_arrival_date || null,
          description: formData.description || null,
          notes: formData.notes || null,
          updated_by: user.id,
        })
        .eq('id', packageId);

      if (error) throw error;

      // ステータスが変更された場合、履歴に記録
      if (originalPackage.status !== formData.status && statusNote.trim()) {
        await supabase
          .from('package_status_history')
          .insert({
            package_id: packageId,
            status: formData.status,
            changed_by: user.id,
            notes: statusNote.trim(),
          });
      }

      router.push(`/packages/${packageId}`);
    } catch (error) {
      console.error('Error updating package:', error);
      alert('更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'shipped': return '発送済み';
      case 'in_transit_international': return '配送中（国際輸送）';
      case 'customs_processing': return '通関手続き中';
      case 'in_transit_domestic': return '配送中（国内）';
      case 'arrived': return '到着済み';
      case 'received': return '受取確認済み';
      default: return '不明';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'editor']}>
        <Layout>
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              読み込み中...
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (!originalPackage) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'editor']}>
        <Layout>
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">荷物が見つかりません</h3>
              <Link href="/packages" className="text-indigo-600 hover:text-indigo-500 mt-2 inline-block">
                荷物一覧に戻る
              </Link>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  const statusChanged = originalPackage.status !== formData.status;

  return (
    <ProtectedRoute requiredRoles={['admin', 'editor']}>
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          {originalPackage && (
            <Breadcrumb
              items={[
                { label: '荷物管理', href: '/packages' },
                { label: originalPackage.tracking_number, href: `/packages/${packageId}` },
                { label: '編集' }
              ]}
            />
          )}

          {/* Header */}
          <div className="mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">荷物情報編集</h1>
              <p className="mt-2 text-gray-600">{formData.tracking_number}</p>
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

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  配送ステータス <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  required
                  value={formData.status}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="shipped">発送済み</option>
                  <option value="in_transit_international">配送中（国際輸送）</option>
                  <option value="customs_processing">通関手続き中</option>
                  <option value="in_transit_domestic">配送中（国内）</option>
                  <option value="arrived">到着済み</option>
                  <option value="received">受取確認済み</option>
                </select>
                {statusChanged && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm font-medium text-yellow-800">
                      ステータスが変更されました: {getStatusLabel(originalPackage.status)} → {getStatusLabel(formData.status)}
                    </p>
                    <div className="mt-2">
                      <label htmlFor="status_note" className="block text-sm font-medium text-yellow-800 mb-1">
                        変更理由・備考
                      </label>
                      <textarea
                        id="status_note"
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        rows={2}
                        className="block w-full px-3 py-2 border border-yellow-300 rounded-md shadow-sm placeholder-yellow-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 resize-vertical"
                        placeholder="ステータス変更の理由や詳細を入力してください"
                      />
                    </div>
                  </div>
                )}
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

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <Link
                  href={`/packages/${packageId}`}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  キャンセル
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      保存
                    </>
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