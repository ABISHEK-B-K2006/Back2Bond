import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  X, 
  Image, 
  Video, 
  FileText, 
  Link, 
  Calendar, 
  MapPin, 
  Hash,
  Users,
  Globe,
  Building,
  Zap,
  Upload,
  Plus,
  AlertCircle
} from 'lucide-react';

interface UnifiedPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  initialPost?: {
    id: string;
    title: string;
    content: string;
    type: 'common' | 'student_only' | 'alumni_only' | 'announcement';
    media_urls?: string[];
  } | null;
}

export function UnifiedPostModal({ isOpen, onClose, onPostCreated, initialPost }: UnifiedPostModalProps) {
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: initialPost?.title || '',
    content: initialPost?.content || '',
    type: initialPost?.type || 'common' as 'common' | 'student_only' | 'alumni_only' | 'announcement',
    visibility: 'public' as 'public' | 'connections' | 'private'
  });
  
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>(initialPost?.media_urls || []);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const getAvailablePostTypes = () => {
    const types = [
      { value: 'common', label: 'Community', icon: Globe, description: 'Visible to all users', color: 'bg-blue-100 text-blue-700' }
    ];

    if (profile?.role === 'student') {
      types.push({
        value: 'student_only' as const,
        label: 'Students Only',
        icon: Users,
        description: 'Visible only to students and admins',
        color: 'bg-green-100 text-green-700'
      });
    }

    if (profile?.role === 'alumni') {
      types.push({
        value: 'alumni_only' as const,
        label: 'Alumni Only',
        icon: Building,
        description: 'Visible only to alumni and admins',
        color: 'bg-purple-100 text-purple-700'
      });
    }

    if (profile?.role === 'admin') {
      types.push(
        {
          value: 'student_only' as const,
          label: 'Students Only',
          icon: Users,
          description: 'Visible only to students and admins',
          color: 'bg-green-100 text-green-700'
        },
        {
          value: 'alumni_only' as const,
          label: 'Alumni Only',
          icon: Building,
          description: 'Visible only to alumni and admins',
          color: 'bg-purple-100 text-purple-700'
        },
        {
          value: 'announcement' as const,
          label: 'Announcement',
          icon: Zap,
          description: 'Official announcement visible to everyone',
          color: 'bg-red-100 text-red-700'
        }
      );
    }

    return types;
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || 
                         file.type.startsWith('video/') || 
                         file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });
    
    setMediaFiles(prev => [...prev, ...validFiles]);
  }, []);

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeUrl = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const uploadFiles = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    const totalFiles = mediaFiles.length;
    
    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${profile?.id}/${fileName}`; // User-specific folder

      setUploadProgress(((i + 1) / totalFiles) * 100);

      try {
        const { data, error } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (error) {
          // Handle bucket not found error
          if (error.message.includes('Bucket not found') || error.message.includes('bucket_id')) {
            throw new Error('Media storage is not configured. Please contact the administrator to set up file uploads.');
          }
          throw error;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);
        
        uploadedUrls.push(publicUrl);
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setError('');
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let uploadedUrls: string[] = [];
      
      // Try to upload files if any are selected
      if (mediaFiles.length > 0) {
        try {
          uploadedUrls = await uploadFiles();
        } catch (uploadError) {
          // If upload fails due to bucket issues, continue with text-only post
          console.warn('File upload failed, creating text-only post:', uploadError);
          setError('File upload failed - creating text-only post instead.');
          // Don't return, continue with text post
        }
      }

      const postData = {
        author_id: profile.id,
        title: formData.title.trim(),
        content: formData.content.trim(),
        type: formData.type,
        media_urls: uploadedUrls.length > 0 ? uploadedUrls : (mediaUrls.length > 0 ? mediaUrls : null),
        media_type: uploadedUrls.length > 0 || mediaUrls.length > 0 ? 'mixed' : 'text',
        visibility: formData.visibility,
        target_skills: tags.length > 0 ? tags : null
      };

      if (initialPost) {
        // Update existing post
        const { error: updateError } = await (supabase
          .from('posts')
          .update({
            title: postData.title,
            content: postData.content,
            type: postData.type
          })
          .eq('id', initialPost.id) as any);

        if (updateError) throw updateError;
      } else {
        // Create new post
        const { error: insertError } = await (supabase
          .from('posts')
          .insert({
            author_id: postData.author_id,
            title: postData.title,
            content: postData.content,
            type: postData.type
          }) as any);

        if (insertError) throw insertError;
      }

      onPostCreated();
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        type: 'common',
        visibility: 'public'
      });
      setMediaFiles([]);
      setMediaUrls([]);
      setTags([]);
      setTagInput('');
      
    } catch (error) {
      console.error('Error creating/updating post:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while creating the post');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialPost ? 'Edit Post' : 'Create Post'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Post Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Post Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getAvailablePostTypes().map((type) => {
                  const Icon = type.icon;
                  return (
                    <label key={type.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-xl transition-all ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${type.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{type.label}</div>
                            <div className="text-sm text-gray-600">{type.description}</div>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Give your post a compelling title..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                required
                maxLength={200}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.title.length}/200 characters
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Share your thoughts, insights, experiences, or knowledge..."
                required
                maxLength={5000}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.content.length}/5000 characters
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (Optional)
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      <Hash className="h-3 w-3 mr-1" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-blue-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Media (Optional)
              </label>
              
              {/* File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <Upload className="h-5 w-5" />
                  <span>Click to upload images, videos, or documents</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Max 10MB per file • PNG, JPG, MP4, PDF supported
                </div>
                <div className="text-xs text-amber-600 mt-1 font-medium">
                  Note: If file upload fails, your post will be created as text-only
                </div>
              </button>

              {/* Upload Progress */}
              {isSubmitting && uploadProgress > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Uploading files...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Selected Files Preview */}
              {mediaFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-sm font-medium text-gray-700">Selected Files:</div>
                  {mediaFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {file.type.startsWith('image/') && <Image className="h-4 w-4 text-blue-500" />}
                        {file.type.startsWith('video/') && <Video className="h-4 w-4 text-purple-500" />}
                        {file.type === 'application/pdf' && <FileText className="h-4 w-4 text-red-500" />}
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visibility Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="public">Public - Anyone can see this post</option>
                <option value="connections">Connections Only - Only your connections can see</option>
                <option value="private">Private - Only visible to you</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting
                  ? (initialPost ? 'Updating...' : 'Creating...')
                  : (initialPost ? 'Update Post' : 'Share Post')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}