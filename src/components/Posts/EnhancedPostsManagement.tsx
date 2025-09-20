import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../types/database';
import { ModernLayout } from '../Layout/ModernLayout';
import { EnhancedPostCard } from './EnhancedPostCard';
import { UnifiedPostModal } from './UnifiedPostModal';
import { 
  Plus, 
  Filter, 
  Search, 
  TrendingUp, 
  Users, 
  Globe,
  Eye,
  MessageSquare,
  Heart,
  Share2,
  FileText,
  Zap,
  Sparkles
} from 'lucide-react';

type Post = Database['public']['Tables']['posts']['Row'] & {
  author: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    role: 'admin' | 'student' | 'alumni';
    current_position?: string;
    company?: string;
  };
  post_likes: { user_id: string }[];
  post_comments: { 
    id: string; 
    content: string; 
    author: { full_name: string } 
  }[];
};

type PostFilter = 'all' | 'common' | 'student' | 'alumni' | 'announcements' | 'my_posts';
type PostSort = 'newest' | 'popular' | 'trending';

export function EnhancedPostsManagement() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PostFilter>('all');
  const [sort, setSort] = useState<PostSort>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [stats, setStats] = useState({
    totalPosts: 0,
    myPosts: 0,
    totalLikes: 0,
    totalComments: 0
  });

  useEffect(() => {
    if (profile) {
      fetchPosts();
    }
  }, [profile]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [posts, filter, sort, searchTerm]);

  const fetchPosts = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(id, full_name, avatar_url, role, current_position, company),
          post_likes(user_id),
          post_comments(id, content, author:profiles!post_comments_author_id_fkey(full_name))
        `)
        .order('created_at', { ascending: false });

      // Apply role-based filtering
      if (profile.role === 'student') {
        query = query.in('type', ['common', 'student_only', 'announcement']);
      } else if (profile.role === 'alumni') {
        query = query.in('type', ['common', 'alumni_only', 'announcement']);
      }

      const { data, error } = await query;

      if (error) throw error;

      const postsWithStats = (data || []).map((post: any) => ({
        ...post,
        author: Array.isArray(post.author) ? post.author[0] : post.author,
        post_likes: post.post_likes || [],
        post_comments: (post.post_comments || []).map((comment: any) => ({
          ...comment,
          author: Array.isArray(comment.author) ? comment.author[0] : comment.author
        }))
      })) as Post[];

      setPosts(postsWithStats);
      calculateStats(postsWithStats);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (postsData: Post[]) => {
    const myPosts = postsData.filter(post => post.author.id === profile?.id);
    const totalLikes = postsData.reduce((sum, post) => sum + post.post_likes.length, 0);
    const totalComments = postsData.reduce((sum, post) => sum + post.post_comments.length, 0);

    setStats({
      totalPosts: postsData.length,
      myPosts: myPosts.length,
      totalLikes,
      totalComments
    });
  };

  const applyFiltersAndSort = () => {
    let filtered = [...posts];

    // Apply filters
    switch (filter) {
      case 'common':
        filtered = filtered.filter(post => post.type === 'common');
        break;
      case 'student':
        filtered = filtered.filter(post => post.type === 'student_only');
        break;
      case 'alumni':
        filtered = filtered.filter(post => post.type === 'alumni_only');
        break;
      case 'announcements':
        filtered = filtered.filter(post => post.type === 'announcement');
        break;
      case 'my_posts':
        filtered = filtered.filter(post => post.author.id === profile?.id);
        break;
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    switch (sort) {
      case 'popular':
        filtered.sort((a, b) => 
          (b.post_likes.length + b.post_comments.length) - 
          (a.post_likes.length + a.post_comments.length)
        );
        break;
      case 'trending':
        // Simple trending algorithm based on recent engagement
        filtered.sort((a, b) => {
          const aScore = (a.post_likes.length * 2 + a.post_comments.length * 3) / 
            (Date.now() - new Date(a.created_at).getTime());
          const bScore = (b.post_likes.length * 2 + b.post_comments.length * 3) / 
            (Date.now() - new Date(b.created_at).getTime());
          return bScore - aScore;
        });
        break;
      default: // newest
        filtered.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    setFilteredPosts(filtered);
  };

  const handlePostUpdated = () => {
    fetchPosts();
    setShowCreateModal(false);
    setSelectedPost(null);
  };

  const handleEditPost = (post: Post) => {
    setSelectedPost(post);
    setShowCreateModal(true);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const getFilterLabel = (filterType: PostFilter) => {
    switch (filterType) {
      case 'all': return 'All Posts';
      case 'common': return 'Community';
      case 'student': return 'Students Only';
      case 'alumni': return 'Alumni Only';
      case 'announcements': return 'Announcements';
      case 'my_posts': return 'My Posts';
      default: return 'All Posts';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <ModernLayout activeTab="posts">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Community Hub</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Share knowledge, connect with peers, and engage with the community
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Posts</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalPosts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">My Posts</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.myPosts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-xl">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Likes</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalLikes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Comments</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalComments}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Left: Create Button */}
              <div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-medium"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Create Post
                </button>
              </div>

              {/* Right: Search and Filters */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Filter */}
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as PostFilter)}
                  className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Posts</option>
                  <option value="common">Community</option>
                  {profile?.role !== 'alumni' && <option value="student">Students Only</option>}
                  {profile?.role !== 'student' && <option value="alumni">Alumni Only</option>}
                  <option value="announcements">Announcements</option>
                  <option value="my_posts">My Posts</option>
                </select>

                {/* Sort */}
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as PostSort)}
                  className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="trending">Trending</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            <div className="mt-4 flex items-center space-x-2">
              <span className="text-sm text-gray-600">Showing:</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {getFilterLabel(filter)}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {sort === 'newest' ? 'Newest First' : sort === 'popular' ? 'Most Popular' : 'Trending'}
              </span>
              {searchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Search: \"{searchTerm}\"
                </span>
              )}
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-8">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <EnhancedPostCard
                  key={post.id}
                  post={post}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                />
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <FileText className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-medium text-gray-900 mb-3">No posts found</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {searchTerm 
                    ? "Try adjusting your search terms or filters to find what you're looking for."
                    : "Be the first to share something amazing with the community!"
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-medium"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Create First Post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Unified Post Modal */}
        {showCreateModal && (
          <UnifiedPostModal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              setSelectedPost(null);
            }}
            onPostCreated={handlePostUpdated}
            initialPost={selectedPost ? {
              id: selectedPost.id,
              title: selectedPost.title,
              content: selectedPost.content,
              type: selectedPost.type,
              media_urls: selectedPost.media_urls
            } : null}
          />
        )}
      </ModernLayout>
    </div>
  );
}