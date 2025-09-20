import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ModernLayout } from '../Layout/ModernLayout';
import { PostCard } from '../Posts/PostCard';
import { UnifiedPostModal } from '../Posts/UnifiedPostModal';
import { Database } from '../../types/database';
import {
  Plus,
  TrendingUp,
  Users,
  MessageSquare,
  Briefcase,
  Calendar,
  BookOpen,
  Award,
  Star,
  ExternalLink,
  MapPin,
  Building2,
  GraduationCap,
  Eye,
  Heart,
  Share2
} from 'lucide-react';

type Post = Database['public']['Tables']['posts']['Row'] & {
  author: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    role: 'admin' | 'student' | 'alumni';
    company?: string | null;
    position?: string | null;
    course?: string | null;
  };
  post_likes: { user_id: string }[];
  post_comments: { id: string; content: string; author: { full_name: string } }[];
};

type Profile = Database['public']['Tables']['profiles']['Row'];

export function FeedHomePage() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestedConnections, setSuggestedConnections] = useState<Profile[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalConnections: 0,
    profileViews: 0,
    postLikes: 0
  });

  useEffect(() => {
    if (profile) {
      fetchFeedData();
    }
  }, [profile]);

  const fetchFeedData = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchPosts(),
        fetchSuggestedConnections(),
        fetchTrendingTopics(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching feed data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(id, full_name, avatar_url, role, company, position, course),
          post_likes(user_id),
          post_comments(id, content, author:profiles!post_comments_author_id_fkey(full_name))
        `)
        .order('created_at', { ascending: false })
        .limit(20);

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
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchSuggestedConnections = async () => {
    if (!profile) return;

    try {
      // Get users with similar skills or from same course/company
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', profile.id)
        .neq('role', profile.role) // Suggest different roles
        .limit(5);

      if (error) throw error;
      setSuggestedConnections(data || []);
    } catch (error) {
      console.error('Error fetching suggested connections:', error);
    }
  };

  const fetchTrendingTopics = async () => {
    // Simulate trending topics based on skills and popular hashtags
    const topics = [
      'React Development',
      'Career Growth',
      'Machine Learning',
      'Startup Culture',
      'Remote Work',
      'Data Science',
      'Product Management',
      'Software Engineering'
    ];
    setTrendingTopics(topics.slice(0, 5));
  };

  const fetchStats = async () => {
    if (!profile) return;

    try {
      // Get user's post count
      const { count: postCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', profile.id);

      // Get user's likes count
      const { data: userPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('author_id', profile.id);
      
      const postIds = (userPosts || []).map((p: any) => p.id);
      
      const { count: likesCount } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .in('post_id', postIds);

      setStats({
        totalPosts: postCount || 0,
        totalConnections: 0, // Would need a connections table
        profileViews: Math.floor(Math.random() * 50) + 10, // Simulated
        postLikes: likesCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handlePostUpdated = () => {
    fetchPosts();
    setShowCreatePost(false);
  };

  if (loading) {
    return (
      <ModernLayout activeTab="home">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout activeTab="home">
      {/* Colorful Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-br from-violet-200 to-pink-200 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-gradient-to-br from-emerald-200 to-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/3 left-1/3 w-48 h-48 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-pulse animation-delay-4000"></div>
      </div>
      
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Profile Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x"></div>
            <div className="px-6 pb-6">
              <div className="relative -mt-10 mb-4">
                <img
                  src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=6366f1&color=ffffff`}
                  alt={profile?.full_name}
                  className="w-20 h-20 rounded-full border-4 border-white bg-white"
                />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">{profile?.full_name}</h3>
              <p className="text-gray-600 text-sm mb-2">
                {profile?.role === 'student' ? (profile as any)?.course : (profile as any)?.position}
                {(profile as any)?.company && ` at ${(profile as any).company}`}
              </p>
              {profile?.location && (
                <p className="text-gray-500 text-sm flex items-center mb-3">
                  <MapPin className="h-3 w-3 mr-1" />
                  {profile.location}
                </p>
              )}
              
              {/* Profile Stats */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="font-semibold text-blue-600">{stats.profileViews}</p>
                  <p className="text-xs text-gray-500">Profile views</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-green-600">{stats.totalConnections}</p>
                  <p className="text-xs text-gray-500">Connections</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Your Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Posts created</span>
                <span className="font-medium text-gray-900">{stats.totalPosts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Post likes</span>
                <span className="font-medium text-gray-900">{stats.postLikes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Profile views</span>
                <span className="font-medium text-gray-900">{stats.profileViews}</span>
              </div>
            </div>
          </div>

          {/* Suggested Connections */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Suggested for you
            </h3>
            <div className="space-y-3">
              {suggestedConnections.slice(0, 3).map((connection) => (
                <div key={connection.id} className="flex items-center space-x-3">
                  <img
                    src={connection.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(connection.full_name)}&background=6366f1&color=ffffff`}
                    alt={connection.full_name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {connection.full_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {connection.role === 'student' ? (connection as any).course : (connection as any).position}
                    </p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Connect
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-center text-blue-600 hover:text-blue-800 text-sm font-medium">
              See all suggestions
            </button>
          </div>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <img
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=6366f1&color=ffffff`}
                alt={profile?.full_name}
                className="w-12 h-12 rounded-full"
              />
              <button
                onClick={() => setShowCreatePost(true)}
                className="flex-1 text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              >
                Share your thoughts...
              </button>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowCreatePost(true)}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="font-medium">Create Post</span>
              </button>
              <div className="flex space-x-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <BookOpen className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Calendar className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-6">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <PostCard post={post} onEdit={() => {}} />
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-500 mb-6">Be the first to share something with the community!</p>
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Trending & Activities */}
        <div className="lg:col-span-1 space-y-6">
          {/* Trending Topics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
              Trending Topics
            </h3>
            <div className="space-y-3">
              {trendingTopics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg cursor-pointer transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">#{topic.replace(/\s+/g, '')}</p>
                    <p className="text-xs text-gray-500">{Math.floor(Math.random() * 100) + 10}K posts</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-purple-600" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900">New connection request</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900">Your post got 5 new likes</p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900">Mentorship request received</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-700">Send Message</span>
              </button>
              <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3">
                <Briefcase className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-700">Find Mentor</span>
              </button>
              <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-700">Join Network</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <UnifiedPostModal
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          onPostCreated={handlePostUpdated}
        />
      )}
    </ModernLayout>
  );
}