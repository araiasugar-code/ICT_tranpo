'use client';

import { useState, useCallback } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface UploadedFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  document_type: string;
  uploaded_at: string;
}

interface FileUploadProps {
  packageId: string;
  onUploadComplete: (file: UploadedFile) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf'
];

export default function FileUpload({ packageId, onUploadComplete }: FileUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const uploadFile = async (file: File, documentType: string = 'other') => {
    if (!user) return;

    setUploading(true);
    setError('');

    try {
      // ファイルサイズチェック
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('ファイルサイズが10MBを超えています');
      }

      // ファイルタイプチェック
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('サポートされていないファイル形式です（PDF、JPEG、PNG、GIF、WebPのみ）');
      }

      // ファイル名を生成（重複回避）
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${file.name}`;
      // 一時パッケージの場合は特別なパス構造を使用
      const filePath = packageId === 'temp-package' 
        ? `temp/${timestamp}_${file.name}`
        : `packages/${packageId}/${fileName}`;

      console.log('ファイルアップロード開始（Supabase Storage）:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      
      // 1. Supabase Storageにファイルをアップロード
      const uploadStartTime = Date.now();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('file')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          // パフォーマンス最適化
          duplex: 'half'
        });

      const uploadDuration = Date.now() - uploadStartTime;
      console.log(`Storage upload completed in ${uploadDuration}ms:`, uploadData);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        
        // 詳細なエラーメッセージ
        let errorMessage = 'ファイルのアップロードに失敗しました';
        if (uploadError.message?.includes('Payload too large')) {
          errorMessage = 'ファイルサイズが大きすぎます（10MB以下にしてください）';
        } else if (uploadError.message?.includes('storage/object-not-found')) {
          errorMessage = 'ストレージバケットが見つかりません。管理者に連絡してください';
        } else if (uploadError.message?.includes('row-level security')) {
          errorMessage = 'ファイルのアップロード権限がありません';
        }
        
        throw new Error(`${errorMessage}: ${uploadError.message}`);
      }

      // 2. データベースにメタデータを保存
      const insertData = {
        package_id: packageId === 'temp-package' ? null : packageId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        document_type: documentType,
        uploaded_by: user.id
      };

      console.log('Inserting document metadata:', insertData);

      const { data: savedDocument, error: dbError } = await supabase
        .from('documents')
        .insert(insertData)
        .select()
        .single();

      if (dbError) {
        console.error('Database error details:', dbError);
        // Storageからファイルを削除（ロールバック）
        await supabase.storage.from('file').remove([filePath]);
        throw new Error(`データベース保存に失敗しました: ${dbError.message}`);
      } else {
        console.log('Database save successful:', savedDocument);
        onUploadComplete(savedDocument);
      }

    } catch (error: unknown) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      uploadFile(file);
    }
  }, [packageId, user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      uploadFile(file);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-red-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                {uploading ? 'アップロード中...' : 'ファイルを選択またはドラッグ&ドロップ'}
              </span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">
              PDF、JPEG、PNG、GIF、WebP（最大10MB）
            </p>
          </div>
        </div>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="flex items-center">
              <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full mr-3"></div>
              <span className="text-sm font-medium text-gray-900">アップロード中...</span>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

    </div>
  );
}