import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Search, MessageCircle, Users, BookOpen, Target, Award, Clock, Plus, Filter } from 'lucide-react';
import { PostCard } from '../Posts/PostCard';
import { UnifiedPostModal } from '../Posts/UnifiedPostModal';
import { EnhancedAlumniSearch } from '../Search/EnhancedAlumniSearch';
import { MessageList } from '../Messaging/MessageList';
import EnhancedMessaging from '../Messaging/EnhancedMessaging';
import { MentorshipRequests } from '../Mentorship/MentorshipRequests';
import { StudentCertificates } from '../Certificates/StudentCertificates';
import { SkillBasedFeed } from '../Posts/SkillBasedFeed';
import { ProfessionalLayout } from '../Layout/ProfessionalLayout';

interface StudentStats {
  followingCount: number;
  postsCount: number;
  mentorshipRequests: number;
  unreadMessages: number;
}

interface Post {
  id: string;
  title: string;
  content: string;
  type: 'common' | 'student_only' | 'alumni_only' | 'announcement';
  created_at: string;
  updated_at: string;
  author_id: string;
  media_urls?: string[] | null;
  media_type?: 'text' | 'image' | 'video' | 'mixed' | null;
  visibility?: 'public' | 'connections' | 'private';
  author?: {
    full_name: string;
    avatar_url: string | null;
    role: 'admin' | 'student' | 'alumni';
  };
  profiles?: {
    full_name: string;
    avatar_url: string | null;
    role: 'admin' | 'student' | 'alumni';
    company?: string;
    course?: string;
  };
}

interface RecentActivity {
  id: string;
  type: 'post' | 'message' | 'mentorship' | 'follow';
  title: string;
  description: string;
  created_at: string;
}

export function EnhancedStudentDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'community' | 'search' | 'messages' | 'mentorship' | 'certificates'>('overview');
  const [stats, setStats] = useState<StudentStats>({
    followingCount: 0,
    postsCount: 0,
    mentorshipRequests: 0,
    unreadMessages: 0
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postFilter, setPostFilter] = useState<'all' | 'common' | 'student_only' | 'announcement'>('all');

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchPosts(),
        fetchRecentActivity()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!profile) return;

    try {
      // Following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profile.id);

      // Posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', profile.id);

      // Mentorship requests count
      const { count: mentorshipRequests } = await supabase
        .from('mentorship_requests')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', profile.id);

      // Unread messages count
      const { count: unreadMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', profile.id)
        .eq('read', false);

      setStats({
        followingCount: followingCount || 0,
        postsCount: postsCount || 0,
        mentorshipRequests: mentorshipRequests || 0,
        unreadMessages: unreadMessages || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:profiles!posts_author_id_fkey(full_name, avatar_url, role, company, course)
        `)
        .in('type', ['common', 'student_only', 'announcement'])
        .order('created_at', { ascending: false })
        .limit(20);

      const { data, error } = await query;

      if (error) throw error;

      const formattedPosts = (data || []).map((post: any) => ({
        ...post,
        author: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
        profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
      }));

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchRecentActivity = async () => {
    if (!profile) return;

    try {
      // This is a simplified version - in a real app, you'd have a proper activity feed table
      const activities: RecentActivity[] = [];

      // Recent posts
      const { data: recentPosts } = await supabase
        .from('posts')
        .select('id, title, created_at')
        .eq('author_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(3);

      recentPosts?.forEach((post: any) => {
        activities.push({
          id: `post-${post.id}`,
          type: 'post',
          title: 'Posted',
          description: post.title,
          created_at: post.created_at
        });
      });

      // Recent mentorship requests
      const { data: recentRequests } = await supabase
        .from('mentorship_requests')
        .select('id, created_at, alumni:profiles!mentorship_requests_alumni_id_fkey(full_name)')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(3);

      recentRequests?.forEach((request: any) => {
        activities.push({
          id: `mentorship-${request.id}`,
          type: 'mentorship',
          title: 'Mentorship Request',
          description: `Requested mentorship from ${(request as any).alumni?.full_name}`,
          created_at: request.created_at
        });
      });

      // Sort by created_at
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const filteredPosts = postFilter === 'all' 
    ? posts 
    : posts.filter(post => post.type === postFilter);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post': return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'message': return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'mentorship': return <Users className="h-4 w-4 text-purple-500" />;
      case 'follow': return <Users className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-sky-50 to-teal-50 relative overflow-hidden">
      {/* Floating Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-56 h-56 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-bounce"></div>
        <div className="absolute bottom-32 left-16 w-64 h-64 bg-gradient-to-br from-blue-300 to-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-gradient-to-br from-emerald-300 to-lime-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-ping"></div>
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-gradient-to-br from-orange-300 to-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse animation-delay-1000"></div>
      </div>
      
      <div className="relative z-10 space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl border border-gray-200 p-6 animate-gradient-x">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow-md">Welcome back, {profile?.full_name}!</h1>
            <p className="text-blue-100">Here's what's happening in your academic network</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreatePost(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-xl hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium animate-shimmer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Post</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-2xl shadow-lg border border-gray-200 backdrop-blur-sm">
        <div className="flex space-x-1 p-2">
          {[
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'posts', label: 'Community Posts', icon: BookOpen },
            { id: 'search', label: 'Find Alumni', icon: Search },
            { id: 'messages', label: 'Messages', icon: MessageCircle },
            { id: 'mentorship', label: 'Mentorship', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.id === 'messages' && stats.unreadMessages > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {stats.unreadMessages}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Following</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.followingCount}</p>
                  <p className="text-sm text-gray-500 mt-1">Alumni connections</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Posts Created</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.postsCount}</p>
                  <p className="text-sm text-gray-500 mt-1">Community contributions</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <BookOpen className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mentorship Requests</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.mentorshipRequests}</p>
                  <p className="text-sm text-gray-500 mt-1">Career guidance sought</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unread Messages</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.unreadMessages}</p>
                  <p className="text-sm text-gray-500 mt-1">Pending conversations</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <MessageCircle className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500">No recent activity</p>
              ) : (
                recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="space-y-6">
          {/* Post Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={postFilter}
                onChange={(e) => setPostFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Posts</option>
                <option value="common">Community Posts</option>
                <option value="student_only">Students Only</option>
                <option value="announcement">Announcements</option>
              </select>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-6">
            {filteredPosts.map(post => (
              <PostCard key={post.id} post={{...post, profiles: post.profiles ? {...post.profiles, avatar_url: post.profiles.avatar_url || undefined} : undefined}} />
            ))}
            {filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No posts found</h3>
                <p className="mt-1 text-sm text-gray-500">Try changing your filter or create the first post!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'search' && <EnhancedAlumniSearch />}
      {activeTab === 'messages' && <EnhancedMessaging />}
      {activeTab === 'mentorship' && <MentorshipRequests />}

      {/* Create Post Modal */}
      <UnifiedPostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPostCreated={() => {
          fetchPosts();
          fetchStats();
        }}
      />
    </div>
    </div>
  );
}