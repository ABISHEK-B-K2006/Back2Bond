import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Users, FileText, MessageCircle, Award, Settings, BarChart3, Shield, AlertTriangle } from 'lucide-react';
import { PlatformAnalytics } from '../Analytics/PlatformAnalytics';
import { PostCard } from '../Posts/PostCard';
import { CreatePostModal } from '../Posts/CreatePostModal';
import { MentorshipRequests } from '../Mentorship/MentorshipRequests';

interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalAlumni: number;
  totalPosts: number;
  totalMessages: number;
  activeMentorships: number;
  pendingRequests: number;
  recentSignups: number;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'student' | 'alumni';
  avatar_url: string | null;
  created_at: string;
  course?: string | null;
  company?: string | null;
  current_position?: string | null;
  graduation_year?: number | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
  type: 'common' | 'student_only' | 'alumni_only' | 'announcement';
  created_at: string;
  author_id: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
    role: 'admin' | 'student' | 'alumni';
  };
}

export function EnhancedAdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'users' | 'posts' | 'mentorship'>('overview');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalAlumni: 0,
    totalPosts: 0,
    totalMessages: 0,
    activeMentorships: 0,
    pendingRequests: 0,
    recentSignups: 0
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [userFilter, setUserFilter] = useState<'all' | 'student' | 'alumni' | 'admin'>('all');

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchPosts()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get user counts by role
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('role, created_at');

      if (profilesError) throw profilesError;

      const roleCounts = profiles?.reduce((acc, profile) => {
        acc[profile.role] = (acc[profile.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Recent signups (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentSignups = profiles?.filter(p => 
        new Date(p.created_at) > weekAgo
      ).length || 0;

      // Get posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      // Get messages count
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      // Get active mentorships
      const { count: activeMentorships } = await supabase
        .from('mentorship_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted');

      // Get pending requests
      const { count: pendingRequests } = await supabase
        .from('mentorship_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        totalUsers: profiles?.length || 0,
        totalStudents: roleCounts['student'] || 0,
        totalAlumni: roleCounts['alumni'] || 0,
        totalPosts: postsCount || 0,
        totalMessages: messagesCount || 0,
        activeMentorships: activeMentorships || 0,
        pendingRequests: pendingRequests || 0,
        recentSignups
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(full_name, avatar_url, role)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-100';
      case 'alumni': return 'text-green-600 bg-green-100';
      case 'student': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredUsers = userFilter === 'all' 
    ? users 
    : users.filter(user => user.role === userFilter);

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access denied</h3>
        <p className="mt-1 text-sm text-gray-500">Only administrators can access this dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage and monitor the AlumniConnect platform</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreatePost(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Create Announcement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex space-x-1 p-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'posts', label: 'Content Moderation', icon: FileText },
            { id: 'mentorship', label: 'Mentorship Oversight', icon: Award }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.id === 'mentorship' && stats.pendingRequests > 0 && (
                  <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1">
                    {stats.pendingRequests}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Key Metrics */}
          <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="text-green-600 font-medium">
                      +{stats.recentSignups} this week
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Platform Posts</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalPosts}</p>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="text-blue-600 font-medium">Content created</span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Messages Exchanged</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalMessages}</p>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="text-purple-600 font-medium">Network activity</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <MessageCircle className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Mentorships</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeMentorships}</p>
                  <div className="mt-2 flex items-center text-sm">
                    {stats.pendingRequests > 0 && (
                      <span className="text-orange-600 font-medium">
                        {stats.pendingRequests} pending
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Award className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* User Distribution */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Students</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(stats.totalStudents / stats.totalUsers) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{stats.totalStudents}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Alumni</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(stats.totalAlumni / stats.totalUsers) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{stats.totalAlumni}</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Platform Status</span>
                <span className="flex items-center text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">User Engagement</span>
                <span className="text-sm text-blue-600">
                  {stats.totalUsers > 0 ? Math.round((stats.totalMessages / stats.totalUsers)) : 0} msg/user
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Mentorship Success</span>
                <span className="text-sm text-purple-600">
                  {stats.totalStudents > 0 ? Math.round((stats.activeMentorships / stats.totalStudents) * 100) : 0}% participation
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && <PlatformAnalytics />}

      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <Users className="h-5 w-5 text-gray-400" />
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Users ({users.length})</option>
                <option value="student">Students ({stats.totalStudents})</option>
                <option value="alumni">Alumni ({stats.totalAlumni})</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=6366f1&color=ffffff`}
                            alt={user.full_name}
                            className="h-10 w-10 rounded-full"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.role === 'student' && user.course && (
                          <span>{user.course}</span>
                        )}
                        {user.role === 'alumni' && user.current_position && (
                          <span>{user.current_position}</span>
                        )}
                        {user.role === 'admin' && (
                          <span>System Administrator</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Moderation</h3>
            <p className="text-sm text-gray-600">Monitor and manage all platform content</p>
          </div>
          
          <div className="space-y-6">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'mentorship' && <MentorshipRequests />}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPostCreated={() => {
          fetchPosts();
          fetchStats();
        }}
      />
    </div>
  );
}