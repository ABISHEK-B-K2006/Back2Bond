import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  User, 
  Building, 
  GraduationCap,
  Globe,
  Users,
  Zap,
  Eye,
  Clock,
  Image,
  Video,
  FileText,
  Download,
  Send,
  X,
  Copy,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';

interface Author {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: 'admin' | 'student' | 'alumni';
  current_position?: string;
  company?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  type: 'common' | 'student_only' | 'alumni_only' | 'announcement';
  media_urls?: string[] | null;
  visibility: 'public' | 'connections' | 'private';
  created_at: string;
  updated_at: string;
  author_id: string;
  author?: Author;
  profiles?: Author;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface EnhancedPostCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

export function EnhancedPostCard({ post, onEdit, onDelete }: EnhancedPostCardProps) {
  const { profile } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [shareRecipients, setShareRecipients] = useState<string[]>([]);

  const author = post.author || post.profiles;

  useEffect(() => {
    fetchEngagementData();
  }, [post.id, profile]);

  const fetchEngagementData = async () => {
    if (!profile) return;

    try {
      // Fetch likes
      const { data: likes, error: likesError } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', post.id);

      if (!likesError) {
        setLikesCount(likes?.length || 0);
        setIsLiked(likes?.some((like: any) => like.user_id === profile.id) || false);
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
      console.error('Error fetching engagement data:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          id,
          content,
          created_at,
          author:profiles!post_comments_author_id_fkey(full_name, avatar_url)
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      const formattedComments = (data || []).map((comment: any) => ({
        ...comment,
        author: Array.isArray(comment.author) ? comment.author[0] : comment.author
      }));

      setComments(formattedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    if (!profile) return;

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', profile.id);

        if (error) throw error;

        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: profile.id
          } as any);

        if (error) throw error;

        setIsLiked(true);
        setLikesCount(prev => prev + 1);

        // Create notification for post author
        if (post.author_id !== profile.id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: post.author_id,
              type: 'post',
              title: 'Post Liked',
              content: `${profile.full_name} liked your post \"${post.title}\"`,
              related_id: post.id
            } as any);
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
        } as any);

      if (error) throw error;

      setNewComment('');
      setCommentsCount(prev => prev + 1);
      
      // Refresh comments
      if (showComments) {
        fetchComments();
      }

      // Create notification for post author
      if (post.author_id !== profile.id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: post.author_id,
            type: 'post',
            title: 'New Comment',
            content: `${profile.full_name} commented on your post \"${post.title}\"`,
            related_id: post.id
          } as any);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (method: 'copy' | 'message' | 'email') => {
    const shareText = `${post.title}

${post.content}

Shared via AlumniConnect`;
    const shareUrl = `${window.location.origin}/posts/${post.id}`;
    const fullShareText = `${shareText}\n\n${shareUrl}`;

    try {
      switch (method) {
        case 'copy':
          await navigator.clipboard.writeText(fullShareText);
          // Show success message
          break;
        case 'email':
          window.open(`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(fullShareText)}`);
          break;
        case 'message':
          // This would open a message modal with recipients
          setShowShareModal(true);
          return;
      }
      setShowShareModal(false);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getPostTypeInfo = (type: string) => {
    switch (type) {
      case 'announcement':
        return { label: 'Announcement', icon: Zap, color: 'bg-red-100 text-red-800 border-red-200' };
      case 'alumni_only':
        return { label: 'Alumni Only', icon: Building, color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'student_only':
        return { label: 'Students Only', icon: Users, color: 'bg-green-100 text-green-800 border-green-200' };
      default:
        return { label: 'Community', icon: Globe, color: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return { icon: Building, color: 'text-red-600' };
      case 'alumni':
        return { icon: Building, color: 'text-green-600' };
      case 'student':
        return { icon: GraduationCap, color: 'text-blue-600' };
      default:
        return { icon: User, color: 'text-gray-600' };
    }
  };

  const renderMediaPreview = (mediaUrls: string[]) => {
    if (!mediaUrls || mediaUrls.length === 0) return null;

    return (
      <div className="mt-4 space-y-3">
        {mediaUrls.map((url, index) => {
          const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
          const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
          const isPdf = url.match(/\.pdf$/i);

          return (
            <div key={index} className="relative">
              {isImage && (
                <img
                  src={url}
                  alt="Post media"
                  className="w-full rounded-xl object-cover max-h-96 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(url, '_blank')}
                />
              )}
              {isVideo && (
                <video
                  src={url}
                  controls
                  className="w-full rounded-xl max-h-96"
                  preload="metadata"
                />
              )}
              {isPdf && (
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <FileText className="h-8 w-8 text-red-500" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">PDF Document</div>
                    <div className="text-sm text-gray-600">Click to view</div>
                  </div>
                  <button
                    onClick={() => window.open(url, '_blank')}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const canEditPost = profile?.id === post.author_id || profile?.role === 'admin';
  const postTypeInfo = getPostTypeInfo(post.type);
  const authorRoleInfo = getRoleInfo(author?.role || 'student');
  const PostTypeIcon = postTypeInfo.icon;
  const AuthorIcon = authorRoleInfo.icon;

  return (
    <article className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
      {/* Post Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {/* Author Avatar */}
            {author?.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={author.full_name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                <AuthorIcon className={`h-5 w-5 ${authorRoleInfo.color}`} />
              </div>
            )}
            
            {/* Author Info */}
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                  {author?.full_name || 'Unknown User'}
                </h4>
                <span className={`px-2 py-1 text-xs rounded-full border ${postTypeInfo.color}`}>
                  <PostTypeIcon className="h-3 w-3 inline mr-1" />
                  {postTypeInfo.label}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {author?.current_position && author?.company && (
                  <span>{author.current_position} at {author.company}</span>
                )}
                <span className="mx-2">•</span>
                <time dateTime={post.created_at}>
                  {format(new Date(post.created_at), 'MMM dd, yyyy')}
                </time>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          {canEditPost && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MoreHorizontal className="h-5 w-5 text-gray-500" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <button
                    onClick={() => {
                      onEdit?.(post);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="h-4 w-4 text-gray-500" />
                    <span>Edit Post</span>
                  </button>
                  <button
                    onClick={() => {
                      onDelete?.(post.id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-left hover:bg-gray-50 text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Post</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="px-6 pb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h3>
        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>
        
        {/* Media Preview */}
        {renderMediaPreview(post.media_urls || [])}
      </div>

      {/* Engagement Stats */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            {likesCount > 0 && (
              <span className="flex items-center">
                <Heart className="h-4 w-4 text-red-500 mr-1" />
                {likesCount} {likesCount === 1 ? 'like' : 'likes'}
              </span>
            )}
            {commentsCount > 0 && (
              <span className="flex items-center">
                <MessageSquare className="h-4 w-4 text-blue-500 mr-1" />
                {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            <span>{Math.floor(Math.random() * 100) + 10} views</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                isLiked
                  ? 'text-red-600 bg-red-50 hover:bg-red-100'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">Like</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="font-medium">Comment</span>
            </button>
          </div>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Share2 className="h-5 w-5" />
            <span className="font-medium">Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 bg-gray-50">
          {/* Add Comment */}
          <form onSubmit={handleComment} className="p-4 border-b border-gray-200">
            <div className="flex space-x-3">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
              )}
              <div className="flex-1 flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                {comment.author?.avatar_url ? (
                  <img
                    src={comment.author.avatar_url}
                    alt={comment.author.full_name}
                    className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="font-medium text-gray-900 text-sm mb-1">
                      {comment.author?.full_name || 'Unknown User'}
                    </div>
                    <div className="text-gray-700 text-sm">{comment.content}</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 ml-3">
                    {format(new Date(comment.created_at), 'MMM dd, yyyy • h:mm a')}
                  </div>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Share Post</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={() => handleShare('copy')}
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Copy className="h-5 w-5 text-gray-500" />
                <span>Copy link</span>
              </button>
              <button
                onClick={() => handleShare('email')}
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Mail className="h-5 w-5 text-gray-500" />
                <span>Share via email</span>
              </button>
              <button
                onClick={() => handleShare('message')}
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <MessageSquare className="h-5 w-5 text-gray-500" />
                <span>Send as message</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}