'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import FileUpload from '@/components/FileUpload';
import DocumentViewer from '@/components/DocumentViewer';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft,
  Edit,
  Package,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  FileText,
  Eye,
  Download,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

interface Package {
  id: string;
  tracking_number: string;
  sender_type: 'china_factory' | 'domestic_manufacturer';
  shipping_date: string;
  expected_arrival_date: string | null;
  description: string | null;
  notes: string | null;
  priority_level: 'high' | 'medium' | 'low';
  status: 'in_transit_international' | 'customs_processing' | 'in_transit_domestic' | 'arrived' | 'received';
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

interface PackageProcessing {
  id: string;
  package_id: string;
  tracking_number_confirmation: 'not_started' | 'in_progress' | 'completed';
  reservation_confirmation: 'not_started' | 'in_progress' | 'completed';
  tracking_scheduled_date: string | null;
  reservation_scheduled_date: string | null;
  assigned_to: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface StatusHistory {
  id: string;
  package_id: string;
  status: string;
  changed_at: string;
  changed_by: string;
  notes: string | null;
}

interface Document {
  id: string;
  package_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  document_type: string;
  uploaded_at: string;
  file_data?: string;
}

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasRole, user, profile, loading: authLoading } = useAuth();
  const [packageData, setPackageData] = useState<Package | null>(null);
  const [processing, setProcessing] = useState<PackageProcessing | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '',
    expected_arrival_date: '',
    description: '',
    notes: '',
    priority_level: 'medium'
  });
  const [processingEditMode, setProcessingEditMode] = useState(false);
  const [processingForm, setProcessingForm] = useState({
    tracking_number_confirmation: 'not_started' as const,
    reservation_confirmation: 'not_started' as const,
    tracking_scheduled_date: '',
    reservation_scheduled_date: ''
  });
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);

  const packageId = params.id as string;

  const loadPackageDetails = async () => {
    if (!packageId) {
      console.error('No package ID provided');
      return;
    }

    try {
      console.log('Starting loadPackageDetails for:', packageId);
      console.log('Current user:', user);
      console.log('Current profile:', profile);
      console.log('Auth loading state:', authLoading);
      
      // 認証情報が読み込み中の場合は待機
      if (authLoading) {
        console.log('Auth still loading, waiting...');
        return;
      }
      
      // ユーザーがログインしていない場合はログインページにリダイレクト
      if (!user) {
        console.log('User not logged in, redirecting to login');
        router.push('/login');
        return;
      }
      
      setLoading(true);
      console.log('Loading package details for ID:', packageId);

      // Supabase認証状態を確認
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Supabase session:', session);
      
      // 全ての必要なデータを並列で取得
      console.log('Fetching all data in parallel for packageId:', packageId);
      
      const [
        { data: packageData, error: packageError },
        { data: processingData, error: processingError },
        { data: historyData, error: historyError },
        { data: documentsData, error: documentsError }
      ] = await Promise.all([
        // パッケージ基本情報
        supabase.from('packages').select('*').eq('id', packageId).single(),
        // 処理情報
        supabase.from('package_processing').select('*').eq('package_id', packageId).single(),
        // ステータス履歴
        supabase.from('status_history').select('*').eq('package_id', packageId).order('changed_at', { ascending: false }),
        // 書類
        supabase.from('documents').select('*').eq('package_id', packageId).order('uploaded_at', { ascending: false })
      ]);

      // パッケージデータの処理
      if (packageError) {
        console.error('Package data error:', packageError);
        if (packageError.code === '42501' || packageError.message?.includes('policy')) {
          throw new Error('アクセス権限がありません。管理者に確認してください。');
        }
        throw packageError;
      }

      if (!packageData) {
        throw new Error('パッケージが見つかりませんでした');
      }

      console.log('Package data loaded:', packageData);
      setPackageData(packageData);
      
      // 編集フォームの初期値を設定
      setEditForm({
        status: packageData.status,
        expected_arrival_date: packageData.expected_arrival_date?.split('T')[0] || '',
        description: packageData.description || '',
        notes: packageData.notes || '',
        priority_level: packageData.priority_level
      });

      // 処理状況データの処理
      console.log('Processing data result:', { processingData, processingError });
      if (processingError && processingError.code !== 'PGRST116') {
        console.error('Processing data error:', processingError);
      }

      if (processingData) {
        setProcessing(processingData);
        setProcessingForm({
          tracking_number_confirmation: processingData.tracking_number_confirmation,
          reservation_confirmation: processingData.reservation_confirmation,
          tracking_scheduled_date: processingData.tracking_scheduled_date?.split('T')[0] || '',
          reservation_scheduled_date: processingData.reservation_scheduled_date?.split('T')[0] || ''
        });
      } else {
        // 処理データがない場合は新規作成
        try {
          console.log('Creating new processing record for package:', packageId);
          const { data: newProcessing, error: createError } = await supabase
            .from('package_processing')
            .insert({ 
              package_id: packageId,
              tracking_number_confirmation: 'not_started',
              reservation_confirmation: 'not_started',
              tracking_scheduled_date: null,
              reservation_scheduled_date: null
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating processing record:', createError);
            // フォールバック: 仮想的な処理データを設定
            const defaultProcessing = {
              id: `temp-${packageId}`,
              package_id: packageId,
              tracking_number_confirmation: 'not_started' as const,
              reservation_confirmation: 'not_started' as const,
              tracking_scheduled_date: null,
              reservation_scheduled_date: null,
              assigned_to: null,
              due_date: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            setProcessing(defaultProcessing);
            setProcessingForm({
              tracking_number_confirmation: 'not_started',
              reservation_confirmation: 'not_started',
              tracking_scheduled_date: '',
              reservation_scheduled_date: ''
            });
          } else if (newProcessing) {
            setProcessing(newProcessing);
            setProcessingForm({
              tracking_number_confirmation: newProcessing.tracking_number_confirmation,
              reservation_confirmation: newProcessing.reservation_confirmation,
              tracking_scheduled_date: newProcessing.tracking_scheduled_date?.split('T')[0] || '',
              reservation_scheduled_date: newProcessing.reservation_scheduled_date?.split('T')[0] || ''
            });
          }
        } catch (error) {
          console.error('Error creating processing record:', error);
          // フォールバック処理
          const defaultProcessing = {
            id: `temp-${packageId}`,
            package_id: packageId,
            tracking_number_confirmation: 'not_started' as const,
            reservation_confirmation: 'not_started' as const,
            assigned_to: null,
            due_date: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setProcessing(defaultProcessing);
          setProcessingForm({
            tracking_number_confirmation: 'not_started',
            reservation_confirmation: 'not_started'
          });
        }
      }

      // ステータス履歴データの処理
      console.log('Status history result:', { historyData, historyError });
      if (historyError) {
        console.error('History data error:', historyError);
      } else {
        setStatusHistory(historyData || []);
      }

      // 書類データの処理
      console.log('Documents result:', { documentsData, documentsError });
      if (documentsError) {
        console.error('Documents data error:', documentsError);
      } else {
        setDocuments(documentsData || []);
      }

    } catch (error) {
      console.error('Error loading package details:', error);
      alert(`データの読み込みに失敗しました: ${error.message}`);
    } finally {
      console.log('loadPackageDetails: Setting loading to false');
      setLoading(false);
      console.log('loadPackageDetails: Loading state after setLoading(false):', loading);
    }
  };

  const handleFileUpload = (newFile: Document) => {
    setDocuments(prev => [newFile, ...prev]);
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setDocumentViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setDocumentViewerOpen(false);
    setSelectedDocument(null);
  };

  const handleDeleteDocument = async (document: Document) => {
    if (!user || !hasRole(['admin', 'editor'])) {
      alert('削除権限がありません');
      return;
    }

    if (!confirm(`「${document.file_name}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    try {
      // データベースから削除
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (error) {
        console.error('Document deletion error:', error);
        alert('削除に失敗しました');
        return;
      }

      // 画面から削除
      setDocuments(prev => prev.filter(doc => doc.id !== document.id));
      alert('ファイルを削除しました');
    } catch (error) {
      console.error('Delete operation failed:', error);
      alert('削除処理中にエラーが発生しました');
    }
  };

  const handleSave = async () => {
    if (!user || !packageData) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('packages')
        .update({
          status: editForm.status,
          expected_arrival_date: editForm.expected_arrival_date || null,
          description: editForm.description || null,
          notes: editForm.notes || null,
          priority_level: editForm.priority_level,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', packageId);

      if (error) throw error;

      // データを再読み込み
      await loadPackageDetails();
      setEditMode(false);
    } catch (error) {
      console.error('Save error:', error);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (packageData) {
      setEditForm({
        status: packageData.status,
        expected_arrival_date: packageData.expected_arrival_date?.split('T')[0] || '',
        description: packageData.description || '',
        notes: packageData.notes || '',
        priority_level: packageData.priority_level
      });
    }
    setEditMode(false);
  };

  const handleProcessingSave = async () => {
    if (!user || !processing) {
      console.error('Missing user or processing data:', { user: !!user, processing: !!processing });
      alert('ユーザー情報または処理データが不足しています');
      return;
    }

    setSaving(true);
    try {
      console.log('Current processing state:', processing);
      console.log('Form data to save:', processingForm);
      console.log('Package ID:', packageId);

      // 一時的なIDの場合は新規作成
      if (processing.id.startsWith('temp-')) {
        console.log('Creating new processing record (temp ID detected)');
        const { data, error } = await supabase
          .from('package_processing')
          .insert({
            package_id: packageId,
            tracking_number_confirmation: processingForm.tracking_number_confirmation,
            reservation_confirmation: processingForm.reservation_confirmation,
            tracking_scheduled_date: processingForm.tracking_scheduled_date || null,
            reservation_scheduled_date: processingForm.reservation_scheduled_date || null
          })
          .select()
          .single();

        if (error) {
          console.error('Supabase insert error:', error);
          throw error;
        }

        console.log('Insert successful:', data);
        setProcessing(data);
      } else {
        // 既存レコードの更新
        console.log('Updating existing processing record:', processing.id);
        console.log('Update data:', {
          tracking_number_confirmation: processingForm.tracking_number_confirmation,
          reservation_confirmation: processingForm.reservation_confirmation,
          tracking_scheduled_date: processingForm.tracking_scheduled_date || null,
          reservation_scheduled_date: processingForm.reservation_scheduled_date || null,
        });
        
        const { data, error } = await supabase
          .from('package_processing')
          .update({
            tracking_number_confirmation: processingForm.tracking_number_confirmation,
            reservation_confirmation: processingForm.reservation_confirmation,
            tracking_scheduled_date: processingForm.tracking_scheduled_date || null,
            reservation_scheduled_date: processingForm.reservation_scheduled_date || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', processing.id)
          .select();

        if (error) {
          console.error('Supabase update error:', error);
          console.error('Update error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }

        console.log('Update successful:', data);
      }

      // データを再読み込み
      await loadPackageDetails();
      setProcessingEditMode(false);
      
      // 他のページのキャッシュを無効化
      if (typeof window !== 'undefined') {
        localStorage.setItem('packages-cache-invalidate', Date.now().toString());
      }
      
      alert('処理状況を更新しました');
    } catch (error) {
      console.error('Processing save error:', error);
      alert(`処理状況の保存に失敗しました: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleProcessingCancel = () => {
    if (processing) {
      setProcessingForm({
        tracking_number_confirmation: processing.tracking_number_confirmation,
        reservation_confirmation: processing.reservation_confirmation
      });
    }
    setProcessingEditMode(false);
  };

  useEffect(() => {
    console.log('useEffect triggered with packageId:', packageId);
    console.log('Auth loading:', authLoading, 'User exists:', !!user);
    
    // 認証情報の読み込みが完了し、packageIdが有効な場合のみ実行
    if (packageId && packageId !== 'undefined' && !authLoading && user) {
      loadPackageDetails();
    }
  }, [packageId, authLoading]); // userを依存関係から除去

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

  const getSenderTypeLabel = (type: string) => {
    switch (type) {
      case 'china_factory': return '中国工場';
      case 'domestic_manufacturer': return '国内メーカー';
      default: return '不明';
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

  const getProcessingStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  if (loading || authLoading) {
    return (
      <ProtectedRoute>
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

  if (!packageData) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">荷物が見つかりません</h3>
              <p className="text-gray-500">指定された荷物は存在しないか、削除されています。</p>
              <div className="mt-4">
                <Link
                  href="/packages"
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  荷物一覧に戻る
                </Link>
              </div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: '荷物管理', href: '/packages' },
              { label: packageData.tracking_number }
            ]}
          />

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {packageData.tracking_number}
                </h1>
                <p className="mt-1 text-gray-600">荷物詳細情報</p>
              </div>
              {hasRole(['admin', 'editor']) && (
                <div className="flex space-x-2">
                  {editMode ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {saving ? '保存中...' : '保存'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        キャンセル
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditMode(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      編集
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white shadow-sm border rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Package className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">基本情報</h3>
                </div>

                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">荷物番号</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">
                      {packageData.tracking_number}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">発送元</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {packageData.sender_type}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ステータス</dt>
                    <dd className="mt-1">
                      {editMode ? (
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                          className="block w-full text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="in_transit_international">配送中（国際輸送）</option>
                          <option value="customs_processing">通関手続き中</option>
                          <option value="in_transit_domestic">配送中（国内）</option>
                          <option value="arrived">到着済み</option>
                          <option value="received">受取確認済み</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(packageData.status)}`}>
                          {getStatusLabel(packageData.status)}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">重要度</dt>
                    <dd className="mt-1">
                      {editMode ? (
                        <select
                          value={editForm.priority_level}
                          onChange={(e) => setEditForm(prev => ({ ...prev, priority_level: e.target.value }))}
                          className="block w-full text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="low">低</option>
                          <option value="medium">中</option>
                          <option value="high">高</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(packageData.priority_level)}`}>
                          {getPriorityLabel(packageData.priority_level)}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">発送日</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(packageData.shipping_date)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">予定到着日</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {editMode ? (
                        <input
                          type="date"
                          value={editForm.expected_arrival_date}
                          onChange={(e) => setEditForm(prev => ({ ...prev, expected_arrival_date: e.target.value }))}
                          className="block w-full text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      ) : (
                        packageData.expected_arrival_date ? formatDate(packageData.expected_arrival_date) : '未設定'
                      )}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">荷物概要</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {editMode ? (
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          className="block w-full text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="荷物概要を入力"
                        />
                      ) : (
                        packageData.description || '未設定'
                      )}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">備考</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {editMode ? (
                        <textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                          className="block w-full text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-vertical"
                          placeholder="備考を入力"
                        />
                      ) : (
                        <div className="whitespace-pre-wrap">{packageData.notes || '未設定'}</div>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Status Overview */}
              <div className="bg-white shadow-sm border rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">ステータス概要</h3>
                  </div>
                  {hasRole(['admin', 'editor']) && (
                    <div className="flex space-x-2">
                      {processingEditMode ? (
                        <>
                          <button
                            onClick={handleProcessingSave}
                            disabled={saving}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-indigo-600 border border-transparent rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {saving ? '保存中...' : '保存'}
                          </button>
                          <button
                            onClick={handleProcessingCancel}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            キャンセル
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setProcessingEditMode(true)}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-transparent rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          処理状況を更新
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 荷物ステータス */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">荷物ステータス</h4>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">現在の状況</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(packageData.status)}`}>
                          {getStatusLabel(packageData.status)}
                        </span>
                      </div>
                      {packageData.expected_arrival_date && (
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2" />
                          到着予定: {formatDate(packageData.expected_arrival_date)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 社内処理ステータス */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">社内処理ステータス</h4>
                    <div className="p-4 bg-green-50 rounded-lg">
                      {processing ? (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">荷物番号確認</span>
                              {processingEditMode ? (
                                <select
                                  value={processingForm.tracking_number_confirmation}
                                  onChange={(e) => setProcessingForm(prev => ({ 
                                    ...prev, 
                                    tracking_number_confirmation: e.target.value as 'not_started' | 'in_progress' | 'completed'
                                  }))}
                                  className="text-xs px-2 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                  <option value="not_started">未着手</option>
                                  <option value="in_progress">作業中</option>
                                  <option value="completed">完了</option>
                                </select>
                              ) : (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getProcessingStatusColor(processing.tracking_number_confirmation)}`}>
                                  {getProcessingStatusLabel(processing.tracking_number_confirmation)}
                                </span>
                              )}
                            </div>
                            {processingEditMode && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">処理予定日</span>
                                <input
                                  type="date"
                                  value={processingForm.tracking_scheduled_date}
                                  onChange={(e) => setProcessingForm(prev => ({ 
                                    ...prev, 
                                    tracking_scheduled_date: e.target.value
                                  }))}
                                  className="text-xs px-2 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            )}
                            {!processingEditMode && processing.tracking_scheduled_date && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">処理予定日</span>
                                <span className="text-xs text-gray-700">
                                  {formatDate(processing.tracking_scheduled_date)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">予約受注確認</span>
                              {processingEditMode ? (
                                <select
                                  value={processingForm.reservation_confirmation}
                                  onChange={(e) => setProcessingForm(prev => ({ 
                                    ...prev, 
                                    reservation_confirmation: e.target.value as 'not_started' | 'in_progress' | 'completed'
                                  }))}
                                  className="text-xs px-2 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                  <option value="not_started">未着手</option>
                                  <option value="in_progress">作業中</option>
                                  <option value="completed">完了</option>
                                </select>
                              ) : (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getProcessingStatusColor(processing.reservation_confirmation)}`}>
                                  {getProcessingStatusLabel(processing.reservation_confirmation)}
                                </span>
                              )}
                            </div>
                            {processingEditMode && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">処理予定日</span>
                                <input
                                  type="date"
                                  value={processingForm.reservation_scheduled_date}
                                  onChange={(e) => setProcessingForm(prev => ({ 
                                    ...prev, 
                                    reservation_scheduled_date: e.target.value
                                  }))}
                                  className="text-xs px-2 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            )}
                            {!processingEditMode && processing.reservation_scheduled_date && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">処理予定日</span>
                                <span className="text-xs text-gray-700">
                                  {formatDate(processing.reservation_scheduled_date)}
                                </span>
                              </div>
                            )}
                          </div>
                          {processing.due_date && (
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-2" />
                              期限: {formatDate(processing.due_date)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 text-center py-2">
                          処理データなし
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status History */}
              <div className="bg-white shadow-sm border rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">ステータス履歴</h3>
                </div>

                {statusHistory.length === 0 ? (
                  <p className="text-sm text-gray-500">履歴はありません</p>
                ) : (
                  <div className="space-y-3">
                    {statusHistory.map((history) => (
                      <div key={history.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(history.status)}`}>
                              {getStatusLabel(history.status)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(history.changed_at)}
                            </span>
                          </div>
                          {history.notes && (
                            <p className="mt-1 text-sm text-gray-600">{history.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents Section */}
              {hasRole(['admin', 'editor']) && (
                <div className="bg-white shadow-sm border rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">関連書類</h3>
                  </div>

                  <FileUpload
                    packageId={packageId}
                    onUploadComplete={handleFileUpload}
                  />
                  
                  {/* Documents List with View and Download */}
                  {documents.length > 0 && (
                    <div className="mt-6 space-y-2">
                      <h4 className="text-sm font-medium text-gray-900">アップロード済み書類</h4>
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                              <p className="text-xs text-gray-500">
                                {Math.round(doc.file_size / 1024)} KB • {new Date(doc.uploaded_at).toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* デバッグ用：file_dataの状態を表示 */}
                            <span className="text-xs text-gray-400">
                              {doc.file_data ? '✓' : '✗'} data
                            </span>
                            <button
                              onClick={() => {
                                if (doc.file_data) {
                                  handleViewDocument(doc);
                                } else {
                                  alert('ファイルデータが利用できません。データベースにfile_dataが保存されていない可能性があります。');
                                }
                              }}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 border border-indigo-200 rounded hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              表示
                            </button>
                            <button
                              onClick={() => {
                                if (doc.file_data) {
                                  // Base64からBlobを作成してダウンロード
                                  const base64Data = doc.file_data.split(',')[1];
                                  const byteCharacters = atob(base64Data);
                                  const byteNumbers = new Array(byteCharacters.length);
                                  for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                  }
                                  const byteArray = new Uint8Array(byteNumbers);
                                  const blob = new Blob([byteArray], { type: doc.file_type });
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = doc.file_name;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                }
                              }}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              DL
                            </button>
                            {hasRole(['admin', 'editor']) && (
                              <button
                                onClick={() => handleDeleteDocument(doc)}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-200 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                削除
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Metadata */}
              <div className="bg-white shadow-sm border rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <User className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">更新情報</h3>
                </div>

                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">作成日時</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDateTime(packageData.created_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">更新日時</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDateTime(packageData.updated_at)}
                    </dd>
                  </div>
                </dl>
              </div>

            </div>
          </div>
        </div>
      </Layout>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          isOpen={documentViewerOpen}
          onClose={handleCloseViewer}
        />
      )}
    </ProtectedRoute>
  );
}