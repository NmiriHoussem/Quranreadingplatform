import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SEOSettings {
  id: string;
  setting_key: string;
  setting_value: string | null;
  image_url: string | null;
  updated_at: string;
}

interface SEOAdminProps {
  isDarkMode: boolean;
}

export default function SEOAdmin({ isDarkMode }: SEOAdminProps) {
  const [ogImage, setOgImage] = useState<SEOSettings | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSEOSettings();
  }, []);

  const fetchSEOSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_settings')
        .select('*')
        .eq('setting_key', 'og_image')
        .single();

      if (error) throw error;
      
      setOgImage(data);
      if (data?.image_url) {
        setPreviewUrl(data.image_url);
      }
    } catch (error) {
      console.error('Error fetching SEO settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'يرجى اختيار صورة صالحة (PNG, JPG, أو JPEG)' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت' });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    setMessage(null);

    try {
      // Delete old image if exists
      if (ogImage?.image_url) {
        const oldPath = ogImage.image_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('seo-images')
            .remove([`og-images/${oldPath}`]);
        }
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `og-image-${Date.now()}.${fileExt}`;
      const filePath = `og-images/${fileName}`;

      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from('seo-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type // Explicitly set content type
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('seo-images')
        .getPublicUrl(filePath);

      // Update database
      const { error: updateError } = await supabase
        .from('seo_settings')
        .update({ 
          image_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'og_image');

      if (updateError) throw updateError;

      // Refresh settings
      await fetchSEOSettings();

      setMessage({ 
        type: 'success', 
        text: 'تم تحميل الصورة بنجاح! ستظهر عند مشاركة الموقع على وسائل التواصل الاجتماعي.' 
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setMessage({ 
        type: 'error', 
        text: `حدث خطأ أثناء تحميل الصورة: ${error.message}` 
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          إعدادات SEO
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          إدارة صورة المشاركة على وسائل التواصل الاجتماعي (Open Graph Image)
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <p className="flex-1">{message.text}</p>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <ImageIcon className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              صورة المشاركة الاجتماعية
            </h2>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            هذه الصورة ستظهر عند مشاركة الموقع على Facebook، Twitter، WhatsApp، وغيرها من منصات التواصل الاجتماعي.
          </p>

          {/* Current Image Preview */}
          {previewUrl && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الصورة الحالية:
              </label>
              <div className="relative w-full aspect-[1200/630] bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                <img
                  src={previewUrl}
                  alt="Open Graph Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              {ogImage?.updated_at && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  آخر تحديث: {new Date(ogImage.updated_at).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          )}

          {/* Upload Button */}
          <div>
            <label
              htmlFor="og-image-upload"
              className={`
                inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium
                transition-colors cursor-pointer
                ${uploading
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }
              `}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري التحميل...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>{previewUrl ? 'تغيير الصورة' : 'تحميل صورة'}</span>
                </>
              )}
            </label>
            <input
              id="og-image-upload"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </div>

          {/* Guidelines */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
              إرشادات الصورة:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>✓ الأبعاد الموصى بها: 1200 × 630 بكسل</li>
              <li>✓ نسبة العرض إلى الارتفاع: 1.91:1</li>
              <li>✓ التنسيق: PNG أو JPG</li>
              <li>✓ الحجم الأقصى: 2 ميجابايت</li>
              <li>✓ تجنب وضع نص مهم على الحواف (قد يتم قصه)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Testing Section */}
      <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          اختبار الصورة بعد التحميل
        </h3>
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Facebook:</span>
            <a
              href="https://developers.facebook.com/tools/debug/"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              أداة فحص Facebook
            </a>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Twitter:</span>
            <a
              href="https://cards-dev.twitter.com/validator"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              أداة فحص Twitter
            </a>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn:</span>
            <a
              href="https://www.linkedin.com/post-inspector/"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              أداة فحص LinkedIn
            </a>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          ملاحظة: قد تستغرق بعض المنصات حتى 24 ساعة لتحديث ذاكرة التخزين المؤقت للصورة.
        </p>
      </div>
    </div>
  );
}