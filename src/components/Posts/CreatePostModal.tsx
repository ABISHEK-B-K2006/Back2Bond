import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { X, AlertCircle } from 'lucide-react';
import type { Database } from '../../types/database';

type PostInsert = Database['public']['Tables']['posts']['Insert'];
type PostUpdate = Database['public']['Tables']['posts']['Update'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  initialPost?: {
    id: string;
    title: string;
    content: string;
    type: 'common' | 'student_only' | 'alumni_only' | 'announcement';
  } | null;
}

export function CreatePostModal({ isOpen, onClose, onPostCreated, initialPost }: CreatePostModalProps) {
  const { profile } = useAuth();
  const [title, setTitle] = useState(initialPost?.title || '');
  const [content, setContent] = useState(initialPost?.content || '');
  const [postType, setPostType] = useState<'common' | 'student_only' | 'alumni_only' | 'announcement'>(
    initialPost?.type || 'common'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getAvailablePostTypes = () => {
    const types = [
      { value: 'common', label: 'Community Post', description: 'Visible to all users' }
    ];

    if (profile?.role === 'student') {
      types.push({
        value: 'student_only' as const,
        label: 'Students Only',
        description: 'Visible only to students and admins'
      });
    }

    if (profile?.role === 'alumni') {
      types.push({
        value: 'alumni_only' as const,
        label: 'Alumni Only',
        description: 'Visible only to alumni and admins'
      });
    }

    if (profile?.role === 'admin') {
      types.push(
        {
          value: 'student_only' as const,
          label: 'Students Only',
          description: 'Visible only to students and admins'
        },
        {
          value: 'alumni_only' as const,
          label: 'Alumni Only',
          description: 'Visible only to alumni and admins'
        },
        {
          value: 'announcement' as const,
          label: 'Announcement',
          description: 'Official announcement visible to everyone'
        }
      );
    }

    return types;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSubmitting(true);
    setError('');

    try {
      if (initialPost) {
        // Update existing post
        const updateData: PostUpdate = {
          title: title.trim(),
          content: content.trim(),
          type: postType,
          updated_at: new Date().toISOString()
        };
        
        const { error: updateError } = await supabase
          .from('posts')
          .update(updateData)
          .eq('id', initialPost.id);

        if (updateError) throw updateError;
      } else {
        // Create new post
        const insertData: PostInsert = {
          title: title.trim(),
          content: content.trim(),
          type: postType,
          author_id: profile.id
        };
        
        const { error: insertError } = await supabase
          .from('posts')
          .insert(insertData);

        if (insertError) throw insertError;

        // Create notifications for announcements
        if (postType === 'announcement') {
          // Get all users to notify
          const { data: users } = await supabase
            .from('profiles')
            .select('id')
            .neq('id', profile.id);

          if (users && users.length > 0) {
            const notifications: NotificationInsert[] = users.map(user => ({
              user_id: user.id,
              type: 'announcement' as const,
              title: 'New Announcement',
              content: `${title.substring(0, 100)}${title.length > 100 ? '...' : ''}`,
              related_id: null
            }));

            await supabase.from('notifications').insert(notifications);
          }
        }
      }

      // Reset form
      setTitle('');
      setContent('');
      setPostType('common');
      onPostCreated();
      onClose();
    } catch (error: any) {
      console.error('Error saving post:', error);
      setError(error.message || 'Failed to save post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialPost ? 'Edit Post' : 'Create New Post'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Post Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Post Type
              </label>
              <div className="space-y-2">
                {getAvailablePostTypes().map((type) => (
                  <label key={type.value} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="postType"
                      value={type.value}
                      checked={postType === type.value}
                      onChange={(e) => setPostType(e.target.value as any)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter post title..."
                required
                maxLength={200}
              />
              <div className="text-xs text-gray-500 mt-1">
                {title.length}/200 characters
              </div>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="What would you like to share?"
                required
                maxLength={2000}
              />
              <div className="text-xs text-gray-500 mt-1">
                {content.length}/2000 characters
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting
                ? (initialPost ? 'Updating...' : 'Creating...')
                : (initialPost ? 'Update Post' : 'Create Post')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}