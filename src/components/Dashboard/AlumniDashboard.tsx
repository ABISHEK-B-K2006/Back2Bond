import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  MessageSquare, 
  BookOpen, 
  Bell,
  UserCheck,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface AlumniStats {
  followers: number;
  mentorshipRequests: number;
  acceptedMentorships: number;
  messagesReceived: number;
  postsCreated: number;
  notifications: any[];
  mentorshipByStatus: any[];
}

export function AlumniDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AlumniStats>({
    followers: 0,
    mentorshipRequests: 0,
    acceptedMentorships: 0,
    messagesReceived: 0,
    postsCreated: 0,
    notifications: [],
    mentorshipByStatus: [],
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchAlumniData();
    }
  }, [profile]);

  const fetchAlumniData = async () => {
    if (!profile) return;

    try {
      // Fetch followers count
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profile.id);

      // Fetch mentorship requests
      const { data: mentorshipData, count: mentorshipCount } = await supabase
        .from('mentorship_requests')
        .select(`
          *,
          profiles:student_id (full_name, course, year)
        `)
        .eq('alumni_id', profile.id);

      // Fetch messages received
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', profile.id);

      // Fetch posts created
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', profile.id);

      // Fetch recent posts
      const { data: posts } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (full_name, role)
        `)
        .in('type', ['common', 'alumni_only', 'announcement'])
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch notifications
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Process mentorship data
      const accepted = mentorshipData?.filter(m => m.status === 'accepted').length || 0;
      const pending = mentorshipData?.filter(m => m.status === 'pending').length || 0;
      const rejected = mentorshipData?.filter(m => m.status === 'rejected').length || 0;
      const completed = mentorshipData?.filter(m => m.status === 'completed').length || 0;

      const mentorshipByStatus = [
        { name: 'Pending', value: pending, color: '#F59E0B' },
        { name: 'Accepted', value: accepted, color: '#10B981' },
        { name: 'Completed', value: completed, color: '#3B82F6' },
        { name: 'Rejected', value: rejected, color: '#EF4444' },
      ].filter(item => item.value > 0);

      setStats({
        followers: followersCount || 0,
        mentorshipRequests: mentorshipCount || 0,
        acceptedMentorships: accepted,
        messagesReceived: messagesCount || 0,
        postsCreated: postsCount || 0,
        notifications: notifications || [],
        mentorshipByStatus,
      });

      setRecentRequests(mentorshipData?.slice(0, 5) || []);
      setRecentPosts(posts || []);
    } catch (error) {
      console.error('Error fetching alumni data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMentorshipAction = async (requestId: string, action: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('mentorship_requests')
        .update({ status: action })
        .eq('id', requestId);

      if (error) throw error;

      // Refresh data
      fetchAlumniData();
    } catch (error) {
      console.error('Error updating mentorship request:', error);
    }
  };

  const activityData = [
    { name: 'Followers', value: stats.followers },
    { name: 'Mentorships', value: stats.mentorshipRequests },
    { name: 'Messages', value: stats.messagesReceived },
    { name: 'Posts', value: stats.postsCreated },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 rounded-lg h-64"></div>
            <div className="bg-gray-200 rounded-lg h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {profile?.full_name}!</h1>
        <p className="text-gray-600">Your mentorship impact at a glance</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          to="/mentorship"
          className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 hover:from-green-600 hover:to-green-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Mentorship Requests</h3>
              <p className="text-green-100">{stats.mentorshipRequests} requests</p>
            </div>
            <BookOpen className="h-8 w-8 text-green-200" />
          </div>
        </Link>

        <Link
          to="/messages"
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 hover:from-blue-600 hover:to-blue-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Messages</h3>
              <p className="text-blue-100">Connect with students</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-200" />
          </div>
        </Link>

        <Link
          to="/posts"
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6 hover:from-purple-600 hover:to-purple-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Share Knowledge</h3>
              <p className="text-purple-100">Create posts</p>
            </div>
            <Users className="h-8 w-8 text-purple-200" />
          </div>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Followers</p>
              <p className="text-3xl font-bold text-gray-900">{stats.followers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mentorship Requests</p>
              <p className="text-3xl font-bold text-gray-900">{stats.mentorshipRequests}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Mentorships</p>
              <p className="text-3xl font-bold text-gray-900">{stats.acceptedMentorships}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Award className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Messages</p>
              <p className="text-3xl font-bold text-gray-900">{stats.messagesReceived}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {stats.mentorshipByStatus.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mentorship Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.mentorshipByStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stats.mentorshipByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Mentorship Requests */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Mentorship Requests</h3>
            <Link to="/mentorship" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentRequests.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent requests</p>
            ) : (
              recentRequests.map((request) => (
                <div key={request.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900 text-sm">
                      {request.profiles?.full_name}
                    </p>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                      request.status === 'accepted' ? 'bg-green-100 text-green-600' :
                      request.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {request.profiles?.course} • Year {request.profiles?.year}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{request.message}</p>
                  {request.status === 'pending' && (
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => handleMentorshipAction(request.id, 'accepted')}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleMentorshipAction(request.id, 'rejected')}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Posts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Posts</h3>
            <Link to="/posts" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <div key={post.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    post.type === 'announcement' ? 'bg-red-100 text-red-600' :
                    post.type === 'common' ? 'bg-gray-100 text-gray-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {post.type === 'announcement' ? 'Announcement' :
                     post.type === 'alumni_only' ? 'Alumni' : 'Community'}
                  </span>
                </div>
                <p className="font-medium text-gray-900 text-sm truncate">{post.title}</p>
                <p className="text-sm text-gray-600 truncate">{post.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <Bell className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {stats.notifications.length === 0 ? (
              <p className="text-gray-500 text-sm">No new notifications</p>
            ) : (
              stats.notifications.map((notification) => (
                <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${
                    notification.type === 'message' ? 'bg-blue-100' :
                    notification.type === 'mentorship' ? 'bg-green-100' :
                    'bg-orange-100'
                  }`}>
                    {notification.type === 'message' ? (
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    ) : notification.type === 'mentorship' ? (
                      <BookOpen className="h-4 w-4 text-green-600" />
                    ) : (
                      <Bell className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{notification.title}</p>
                    <p className="text-sm text-gray-600 truncate">{notification.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}