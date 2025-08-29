import { supabase } from './supabase';

const BUCKET_NAME = 'file';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf'
];

export async function ensureBucketExists(): Promise<boolean> {
  try {
    // バケット一覧を取得して存在確認
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (bucketExists) {
      console.log('Documents bucket already exists');
      return true;
    }

    // バケットが存在しない場合は作成
    console.log('Creating documents bucket...');
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: false,
      allowedMimeTypes: ALLOWED_TYPES,
      fileSizeLimit: MAX_FILE_SIZE
    });

    if (createError) {
      console.error('Error creating bucket:', createError);
      return false;
    }

    console.log('Documents bucket created successfully');
    return true;
    
  } catch (error) {
    console.error('Error in ensureBucketExists:', error);
    return false;
  }
}

export async function uploadFile(file: File, packageId: string, userId: string): Promise<any> {
  try {
    // バケットの存在を確認
    await ensureBucketExists();
    
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `packages/${packageId}/${fileName}`;

    // ファイルをアップロード
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // データベースにメタデータを保存
    const { data: documentData, error: dbError } = await supabase
      .from('documents')
      .insert({
        package_id: packageId === 'temp-package' ? null : packageId,
        file_name: file.name,
        file_path: uploadData.path,
        file_type: file.type,
        file_size: file.size,
        document_type: 'other',
        uploaded_by: userId
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return documentData;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}