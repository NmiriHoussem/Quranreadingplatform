import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Save, Eye, X } from 'lucide-react';
import { getStoredUser } from '../../services/authService';
import { updateLogo } from '../utils/logoStorage';
import { getTranslations, getStoredLanguage } from '../utils/translations';

const ADMIN_EMAIL = 'houssem.addin@gmail.com';

interface AdminPanelProps {
  isDarkMode: boolean;
}

export default function AdminPanel({ isDarkMode }: AdminPanelProps) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const language = getStoredLanguage();
  const t = getTranslations(language);
  const isRtl = language === 'ar';
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user is admin
  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-2">
            {isRtl ? 'غير مصرح' : 'Unauthorized'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {isRtl 
              ? 'ليس لديك صلاحية الوصول إلى لوحة الإدارة' 
              : 'You do not have permission to access the admin panel'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            {isRtl ? 'العودة إلى الصفحة الرئيسية' : 'Go to Home'}
          </button>
        </div>
      </div>
    );
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(svg\+xml|png)$/)) {
      setErrorMessage(isRtl 
        ? 'يرجى تحديد ملف SVG أو PNG فقط' 
        : 'Please select only SVG or PNG files');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage(isRtl 
        ? 'حجم الملف يجب أن يكون أقل من 2 ميجابايت' 
        : 'File size must be less than 2MB');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setUploadSuccess(false);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !previewUrl) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // Upload the logo (base64 is already in previewUrl)
      await updateLogo(previewUrl);
      
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);

      // Force page reload to update logo everywhere
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error uploading logo:', error);
      setErrorMessage(isRtl 
        ? 'فشل رفع الشعار. يرجى المحاولة مرة أخرى' 
        : 'Failed to upload logo. Please try again');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">
                {isRtl ? 'لوحة الإدارة' : 'Admin Panel'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isRtl ? 'إدارة إعدادات التطبيق' : 'Manage application settings'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Design Settings Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">
              {isRtl ? 'إعدادات التصميم' : 'Design Settings'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isRtl 
                ? 'رفع شعار مخصص للتطبيق (SVG أو PNG)' 
                : 'Upload a custom logo for the application (SVG or PNG)'}
            </p>
          </div>

          {/* Upload Area */}
          <div className="space-y-6">
            {/* File Input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {isRtl ? 'تحميل الشعار' : 'Upload Logo'}
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".svg,.png,image/svg+xml,image/png"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isRtl ? 'اختيار ملف' : 'Choose File'}</span>
                </label>
                {selectedFile && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedFile.name}
                    </span>
                    <button
                      onClick={handleClear}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title={isRtl ? 'إزالة' : 'Clear'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {isRtl 
                  ? 'الحد الأقصى لحجم الملف: 2 ميجابايت. الأنواع المدعومة: SVG، PNG' 
                  : 'Max file size: 2MB. Supported types: SVG, PNG'}
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Success Message */}
            {uploadSuccess && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">
                  {isRtl 
                    ? '✅ تم رفع الشعار بنجاح! يتم تحديث الصفحة...' 
                    : '✅ Logo uploaded successfully! Refreshing page...'}
                </p>
              </div>
            )}

            {/* Preview */}
            {previewUrl && (
              <div>
                <label className="block text-sm font-medium mb-3">
                  <Eye className="w-4 h-4 inline mr-2" />
                  {isRtl ? 'معاينة' : 'Preview'}
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 bg-gray-50 dark:bg-gray-900">
                  <div className="flex flex-col items-center gap-4">
                    <img
                      src={previewUrl}
                      alt="Logo Preview"
                      className="max-w-[200px] max-h-[200px] object-contain"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isRtl 
                        ? 'سيظهر الشعار بهذا الشكل في التطبيق' 
                        : 'This is how the logo will appear in the app'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Button */}
            {previewUrl && !uploadSuccess && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isUploading 
                    ? (isRtl ? 'جاري الرفع...' : 'Uploading...') 
                    : (isRtl ? 'حفظ الشعار' : 'Save Logo')}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-medium mb-2 text-blue-900 dark:text-blue-100">
            {isRtl ? '💡 ملاحظة' : '💡 Note'}
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>
              {isRtl 
                ? '• سيتم تطبيق الشعار الجديد في جميع أنحاء التطبيق فورًا' 
                : '• The new logo will be applied throughout the app immediately'}
            </li>
            <li>
              {isRtl 
                ? '• يتم تخزين الشعار في قاعدة البيانات وسيكون متاحًا عبر جميع الأجهزة' 
                : '• The logo is stored in the database and will be available across all devices'}
            </li>
            <li>
              {isRtl 
                ? '• للحصول على أفضل النتائج، استخدم شعار مربع (نسبة 1:1)' 
                : '• For best results, use a square logo (1:1 aspect ratio)'}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
