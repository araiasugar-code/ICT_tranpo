'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import { supabase } from '@/lib/supabase';
import { 
  Settings, 
  Save,
  Bell,
  Eye,
  Download,
  Upload,
  Database,
  Mail,
  Smartphone
} from 'lucide-react';

interface SystemSettings {
  notification_email: boolean;
  notification_sms: boolean;
  notification_in_app: boolean;
  auto_backup: boolean;
  backup_frequency: 'daily' | 'weekly' | 'monthly';
  data_retention_days: number;
  default_priority: 'high' | 'medium' | 'low';
  require_shipping_date: boolean;
  require_expected_arrival: boolean;
  allow_file_upload: boolean;
  max_file_size_mb: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    notification_email: true,
    notification_sms: false,
    notification_in_app: true,
    auto_backup: true,
    backup_frequency: 'daily',
    data_retention_days: 365,
    default_priority: 'medium',
    require_shipping_date: true,
    require_expected_arrival: false,
    allow_file_upload: true,
    max_file_size_mb: 10
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
      } else if (data) {
        setSettings({ ...settings, ...data.settings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 'default',
          settings: settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      alert('設定を保存しました');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('設定の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const exportData = async () => {
    try {
      const { data: packages, error: packagesError } = await supabase
        .from('packages')
        .select('*');
      
      const { data: processing, error: processingError } = await supabase
        .from('package_processing')
        .select('*');
      
      if (packagesError || processingError) {
        throw new Error('データの取得に失敗しました');
      }

      const exportData = {
        packages,
        processing,
        exported_at: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `package-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('データをエクスポートしました');
    } catch (error) {
      console.error('Export error:', error);
      alert('エクスポートに失敗しました');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['admin']}>
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

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb items={[{ label: 'システム設定' }]} />
          
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">システム設定</h1>
            <p className="mt-2 text-gray-600">システムの各種設定を行います</p>
          </div>

          <div className="space-y-6">
            {/* 通知設定 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center mb-4">
                <Bell className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">通知設定</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">メール通知</label>
                    <p className="text-sm text-gray-500">重要な変更をメールで通知</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notification_email}
                    onChange={(e) => updateSetting('notification_email', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">SMS通知</label>
                    <p className="text-sm text-gray-500">緊急時にSMSで通知</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notification_sms}
                    onChange={(e) => updateSetting('notification_sms', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">アプリ内通知</label>
                    <p className="text-sm text-gray-500">システム内での通知表示</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notification_in_app}
                    onChange={(e) => updateSetting('notification_in_app', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            {/* データ管理設定 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center mb-4">
                <Database className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">データ管理</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">自動バックアップ</label>
                    <p className="text-sm text-gray-500">定期的にデータをバックアップ</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.auto_backup}
                    onChange={(e) => updateSetting('auto_backup', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                {settings.auto_backup && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">バックアップ頻度</label>
                    <select
                      value={settings.backup_frequency}
                      onChange={(e) => updateSetting('backup_frequency', e.target.value as any)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="daily">毎日</option>
                      <option value="weekly">毎週</option>
                      <option value="monthly">毎月</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">データ保持期間（日）</label>
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    value={settings.data_retention_days}
                    onChange={(e) => updateSetting('data_retention_days', parseInt(e.target.value))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* 荷物管理設定 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center mb-4">
                <Eye className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">荷物管理設定</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">デフォルト重要度</label>
                  <select
                    value={settings.default_priority}
                    onChange={(e) => updateSetting('default_priority', e.target.value as any)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">発送日必須</label>
                    <p className="text-sm text-gray-500">荷物登録時に発送日を必須にする</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.require_shipping_date}
                    onChange={(e) => updateSetting('require_shipping_date', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">予定到着日必須</label>
                    <p className="text-sm text-gray-500">荷物登録時に予定到着日を必須にする</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.require_expected_arrival}
                    onChange={(e) => updateSetting('require_expected_arrival', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            {/* ファイル管理設定 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center mb-4">
                <Upload className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">ファイル管理設定</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">ファイルアップロード許可</label>
                    <p className="text-sm text-gray-500">ユーザーがファイルをアップロードできる</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allow_file_upload}
                    onChange={(e) => updateSetting('allow_file_upload', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                {settings.allow_file_upload && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">最大ファイルサイズ（MB）</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={settings.max_file_size_mb}
                      onChange={(e) => updateSetting('max_file_size_mb', parseInt(e.target.value))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* データエクスポート */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center mb-4">
                <Download className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">データエクスポート</h3>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  システム内のすべての荷物データと処理状況をJSONファイルとしてエクスポートできます。
                </p>
                <button
                  onClick={exportData}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  データをエクスポート
                </button>
              </div>
            </div>

            {/* 保存ボタン */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    設定を保存
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}