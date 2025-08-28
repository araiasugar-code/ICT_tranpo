'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save, FileText, Clock, User, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Package {
  id: string;
  tracking_number: string;
  sender_type: 'china_factory' | 'domestic_manufacturer';
  status: string;
  description: string | null;
}

interface PackageProcessing {
  id: string;
  package_id: string;
  tracking_number_confirmation: 'not_started' | 'in_progress' | 'completed';
  reservation_confirmation: 'not_started' | 'in_progress' | 'completed';
  assigned_to: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

interface ProcessingFormData {
  tracking_number_confirmation: 'not_started' | 'in_progress' | 'completed';
  reservation_confirmation: 'not_started' | 'in_progress' | 'completed';
  assigned_to: string;
  due_date: string;
}

export default function ProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [packageData, setPackageData] = useState<Package | null>(null);
  const [processing, setProcessing] = useState<PackageProcessing | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [formData, setFormData] = useState<ProcessingFormData>({
    tracking_number_confirmation: 'not_started',
    reservation_confirmation: 'not_started',
    assigned_to: '',
    due_date: '',
  });

  const packageId = params.id as string;

  const loadData = async () => {
    try {
      setLoading(true);

      // パッケージ基本情報を取得
      const { data: packageData, error: packageError } = await supabase
        .from('packages')
        .select('id, tracking_number, sender_type, status, description')
        .eq('id', packageId)
        .single();

      if (packageError) throw packageError;
      setPackageData(packageData);

      // 処理状況を取得または作成
      const { data: processingData, error: processingError } = await supabase
        .from('package_processing')
        .select('*')
        .eq('package_id', packageId)
        .single();

      if (processingError && processingError.code === 'PGRST116') {
        // レコードが存在しない場合、新規作成
        const { data: newProcessing, error: createError } = await supabase
          .from('package_processing')
          .insert({ package_id: packageId })
          .select()
          .single();

        if (createError) throw createError;
        processingData = newProcessing;
      } else if (processingError) {
        throw processingError;
      }

      setProcessing(processingData);
      setFormData({
        tracking_number_confirmation: processingData.tracking_number_confirmation,
        reservation_confirmation: processingData.reservation_confirmation,
        assigned_to: processingData.assigned_to || '',
        due_date: processingData.due_date || '',
      });

      // ユーザー一覧を取得（アサイン用）
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name');

      if (profilesError) {
        console.error('Profiles loading error:', profilesError);
      } else {
        setProfiles(profilesData || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      router.push('/packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (packageId) {
      loadData();
    }
  }, [packageId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !processing) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('package_processing')
        .update({
          tracking_number_confirmation: formData.tracking_number_confirmation,
          reservation_confirmation: formData.reservation_confirmation,
          assigned_to: formData.assigned_to || null,
          due_date: formData.due_date || null,
        })
        .eq('id', processing.id);

      if (error) throw error;

      router.push(`/packages/${packageId}`);
    } catch (error) {
      console.error('Error updating processing:', error);
      alert('更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const getSenderTypeLabel = (type: string) => {
    switch (type) {
      case 'china_factory': return '中国工場';
      case 'domestic_manufacturer': return '国内メーカー';
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

  if (!packageData || !processing) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'editor']}>
        <Layout>
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">データが見つかりません</h3>
              <Link href="/packages" className="text-indigo-600 hover:text-indigo-500 mt-2 inline-block">
                荷物一覧に戻る
              </Link>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['admin', 'editor']}>
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb
            items={[
              { label: '荷物管理', href: '/packages' },
              { label: packageData.tracking_number, href: `/packages/${packageId}` },
              { label: '処理状況更新' }
            ]}
          />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">社内データ処理状況</h1>
            <p className="mt-2 text-gray-600">{packageData.tracking_number}</p>
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            {/* Package Info */}
            <div className="bg-white shadow-sm border rounded-lg p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">荷物情報</h3>
              </div>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">荷物番号</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">
                    {packageData.tracking_number}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">発送元</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {getSenderTypeLabel(packageData.sender_type)}
                  </dd>
                </div>
                {packageData.description && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">概要</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {packageData.description}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Processing Status Form */}
            <form onSubmit={handleSubmit} className="bg-white shadow-sm border rounded-lg p-6 space-y-6">
              <div className="flex items-center mb-6">
                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">処理状況更新</h3>
              </div>

              {/* Current Status Display */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">現在の処理状況</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">荷物番号確認入力</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProcessingStatusColor(processing.tracking_number_confirmation)}`}>
                      {getProcessingStatusLabel(processing.tracking_number_confirmation)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">予約受注確認</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProcessingStatusColor(processing.reservation_confirmation)}`}>
                      {getProcessingStatusLabel(processing.reservation_confirmation)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tracking Number Confirmation */}
              <div>
                <label htmlFor="tracking_number_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                  荷物番号確認入力
                </label>
                <select
                  id="tracking_number_confirmation"
                  name="tracking_number_confirmation"
                  value={formData.tracking_number_confirmation}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="not_started">未着手</option>
                  <option value="in_progress">作業中</option>
                  <option value="completed">完了</option>
                </select>
              </div>

              {/* Reservation Confirmation */}
              <div>
                <label htmlFor="reservation_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                  予約受注確認
                </label>
                <select
                  id="reservation_confirmation"
                  name="reservation_confirmation"
                  value={formData.reservation_confirmation}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="not_started">未着手</option>
                  <option value="in_progress">作業中</option>
                  <option value="completed">完了</option>
                </select>
              </div>

              {/* Assigned To */}
              <div>
                <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-2">
                  担当者
                </label>
                <select
                  id="assigned_to"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">担当者を選択してください</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name || profile.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                  完了期限
                </label>
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                      更新中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      更新
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