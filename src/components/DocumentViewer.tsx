'use client';

import { useState } from 'react';
import { X, Download, Eye, FileText } from 'lucide-react';

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_data?: string;
  document_type: string;
  uploaded_at: string;
}

interface DocumentViewerProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentViewer({ document, isOpen, onClose }: DocumentViewerProps) {
  const [imageError, setImageError] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!document.file_data) return;

    try {
      // Base64データからBlobを作成
      const base64Data = document.file_data.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: document.file_type });
      
      // ダウンロード用のリンクを作成
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('ダウンロードに失敗しました');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const isImage = document.file_type.startsWith('image/');
  const isPDF = document.file_type === 'application/pdf';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-gray-400" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {document.file_name}
              </h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(document.file_size)} • {formatDate(document.uploaded_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {document.file_data && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="h-4 w-4 mr-1" />
                ダウンロード
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {!document.file_data ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">ファイルデータが利用できません</p>
              <p className="text-sm text-gray-400 mt-2">
                このファイルはメタデータのみ保存されています
              </p>
            </div>
          ) : isImage && !imageError ? (
            <div className="text-center">
              <img
                src={document.file_data}
                alt={document.file_name}
                className="max-w-full max-h-[60vh] object-contain mx-auto rounded"
                onError={() => setImageError(true)}
              />
            </div>
          ) : isPDF ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <p className="text-gray-700 mb-4">PDFファイル: {document.file_name}</p>
              <p className="text-sm text-gray-500 mb-4">
                PDFの内容を表示するには、ダウンロードしてください
              </p>
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="h-4 w-4 mr-2" />
                PDFをダウンロード
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">プレビューできないファイル形式です</p>
              <p className="text-sm text-gray-400 mt-2">
                ダウンロードしてファイルを確認してください
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}