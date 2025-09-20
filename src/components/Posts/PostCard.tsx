import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
  User,
  Building,
  GraduationCap,
  Send
} from 'lucide-react';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    type: 'common' | 'student_only' | 'alumni_only' | 'announcement' | 'community';
    media_urls?: string[] | null;
    media_type?: 'text' | 'image' | 'video' | 'mixed' | null;
    target_skills?: string[] | null;
    visibility?: 'public' | 'connections' | 'private';
    created_at: string;
    author_id: string;
    author?: {
      full_name: string;
      avatar_url: string | null;
      role: 'admin' | 'student' | 'alumni';
    };
    profiles?: {
      full_name: string;
      role: string;
      company?: string;
      course?: string;
      avatar_url?: string;
    };
  };
  onEdit?: (post: any) => void;
  onDelete?: (postId: string) => void;
}

interface Like {
  id: string;
  user_id: string;
  post_id: string;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
    role: 'admin' | 'student' | 'alumni';
  };
}

export function PostCard({ post, onEdit, onDelete }: PostCardProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLikesAndComments();
  }, [post.id, profile]);

  const fetchLikesAndComments = async () => {
    if (!profile) return;

    try {
      // Fetch likes count and check if current user liked
      const { data: likes, error: likesError } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', post.id);

      if (!likesError) {
        setLikesCount(likes?.length || 0);
        setIsLiked(likes?.some(like => like.user_id === profile.id) || false);
      }

      // Fetch comments count
      const { count: commentsCount, error: commentsError } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      if (!commentsError) {
        setCommentsCount(commentsCount || 0);
      }

      // Fetch comments if showing
      if (showComments) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error fetching likes and comments:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          author:profiles!post_comments_user_id_fkey(full_name, avatar_url, role)
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'alumni_only':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'student_only':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'Announcement';
      case 'alumni_only':
        return 'Alumni Only';
      case 'student_only':
        return 'Students Only';
      default:
        return 'Community';
    }
  };

  const getAuthorIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Building className="h-4 w-4" />;
      case 'alumni':
        return <User className="h-4 w-4" />;
      case 'student':
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const canEditPost = profile?.id === post.author_id || profile?.role === 'admin';

  const handleLike = async () => {
    if (!profile) return;

    try {
      if (isLiked) {
        // Unlike the post
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', profile.id);

        if (error) throw error;

        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Like the post
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: profile.id
          });

        if (error) throw error;

        setIsLiked(true);
        setLikesCount(prev => prev + 1);

        // Create notification for post author if not liking own post
        if (post.author_id !== profile.id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: post.author_id,
              type: 'post',
              title: 'Post Liked',
              content: `${profile.full_name} liked your post "${post.title}"`,
              related_id: post.id
            });
        }
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          user_id: profile.id,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      setCommentsCount(prev => prev + 1);
      
      // Refresh comments
      if (showComments) {
        fetchComments();
      }

      // Create notification for post author if not commenting on own post
      if (post.author_id !== profile.id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: post.author_id,
            type: 'post',
            title: 'New Comment',
            content: `${profile.full_name} commented on your post "${post.title}"`,
            related_id: post.id
          });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    // TODO: Implement share functionality
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${post.title}\n\n${post.content}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {post.profiles?.avatar_url ? (
            <img
              src={post.profiles.avatar_url}
              alt={post.profiles.full_name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              {getAuthorIcon(post.profiles?.role || 'student')}
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-gray-900">
                {post.profiles?.full_name || 'Unknown User'}
              </h4>
              <span className={`px-2 py-1 text-xs rounded-full border ${getPostTypeColor(post.type)}`}>
                {getPostTypeLabel(post.type)}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{post.profiles?.company || post.profiles?.course || ''}</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {canEditPost && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreHorizontal className="h-5 w-5 text-gray-500" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-32 z-10">
                <button
                  onClick={() => {
                    onEdit?.(post);
                    setShowMenu(false);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    onDelete?.(post.id);
                    setShowMenu(false);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
        <p className="text-gray-700 leading-relaxed">{post.content}</p>
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              isLiked
                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{likesCount}</span>
          </button>

          <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
            <MessageSquare className="h-5 w-5" />
            <span className="text-sm font-medium">{commentsCount}</span>
          </button>
        </div>

        <button
          onClick={handleShare}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Share2 className="h-5 w-5" />
          <span className="text-sm font-medium">Share</span>
        </button>
      </div>
    </div>
  );
}