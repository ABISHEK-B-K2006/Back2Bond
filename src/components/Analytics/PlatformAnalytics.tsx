import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { Users, MessageCircle, UserCheck, FileText, TrendingUp, Calendar } from 'lucide-react';

interface PlatformStats {
  totalUsers: number;
  totalStudents: number;
  totalAlumni: number;
  totalAdmins: number;
  totalPosts: number;
  totalMessages: number;
  totalMentorshipRequests: number;
  activeMentorships: number;
}

interface UserGrowthData {
  month: string;
  students: number;
  alumni: number;
  total: number;
}

interface PostDistributionData {
  type: string;
  count: number;
  percentage: number;
}

interface MentorshipTrendsData {
  month: string;
  pending: number;
  accepted: number;
  completed: number;
  rejected: number;
}

export function PlatformAnalytics() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalAlumni: 0,
    totalAdmins: 0,
    totalPosts: 0,
    totalMessages: 0,
    totalMentorshipRequests: 0,
    activeMentorships: 0
  });
  
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [postDistribution, setPostDistribution] = useState<PostDistributionData[]>([]);
  const [mentorshipTrends, setMentorshipTrends] = useState<MentorshipTrendsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAnalytics();
    }
  }, [profile, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchBasicStats(),
        fetchUserGrowthData(),
        fetchPostDistribution(),
        fetchMentorshipTrends()
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBasicStats = async () => {
    try {
      // Get user counts by role
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('role');

      if (profilesError) throw profilesError;

      const roleCounts = profiles?.reduce((acc, profile) => {
        acc[profile.role] = (acc[profile.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get posts count
      const { count: postsCount, error: postsError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      if (postsError) throw postsError;

      // Get messages count
      const { count: messagesCount, error: messagesError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      if (messagesError) throw messagesError;

      // Get mentorship requests count
      const { count: mentorshipCount, error: mentorshipError } = await supabase
        .from('mentorship_requests')
        .select('*', { count: 'exact', head: true });

      if (mentorshipError) throw mentorshipError;

      // Get active mentorships count
      const { count: activeMentorshipsCount, error: activeMentorshipsError } = await supabase
        .from('mentorship_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted');

      if (activeMentorshipsError) throw activeMentorshipsError;

      setStats({
        totalUsers: profiles?.length || 0,
        totalStudents: roleCounts['student'] || 0,
        totalAlumni: roleCounts['alumni'] || 0,
        totalAdmins: roleCounts['admin'] || 0,
        totalPosts: postsCount || 0,
        totalMessages: messagesCount || 0,
        totalMentorshipRequests: mentorshipCount || 0,
        activeMentorships: activeMentorshipsCount || 0
      });
    } catch (error) {
      console.error('Error fetching basic stats:', error);
    }
  };

  const fetchUserGrowthData = async () => {
    try {
      const months = [];
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
          date: date.toISOString()
        });
      }

      const growthData: UserGrowthData[] = [];

      for (const monthData of months) {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('role, created_at')
          .lte('created_at', monthData.date);

        if (error) throw error;

        const roleCounts = profiles?.reduce((acc, profile) => {
          acc[profile.role] = (acc[profile.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        growthData.push({
          month: monthData.month,
          students: roleCounts['student'] || 0,
          alumni: roleCounts['alumni'] || 0,
          total: profiles?.length || 0
        });
      }

      setUserGrowth(growthData);
    } catch (error) {
      console.error('Error fetching user growth data:', error);
    }
  };

  const fetchPostDistribution = async () => {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('type');

      if (error) throw error;

      const typeCount = posts?.reduce((acc, post) => {
        acc[post.type] = (acc[post.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const total = posts?.length || 0;
      
      const distribution = Object.entries(typeCount).map(([type, count]) => ({
        type: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count,
        percentage: Math.round((count / total) * 100)
      }));

      setPostDistribution(distribution);
    } catch (error) {
      console.error('Error fetching post distribution:', error);
    }
  };

  const fetchMentorshipTrends = async () => {
    try {
      const months = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        months.push({
          month: date.toLocaleString('default', { month: 'short' }),
          startDate: date.toISOString(),
          endDate: nextMonth.toISOString()
        });
      }

      const trendsData: MentorshipTrendsData[] = [];

      for (const monthData of months) {
        const { data: requests, error } = await supabase
          .from('mentorship_requests')
          .select('status')
          .gte('created_at', monthData.startDate)
          .lt('created_at', monthData.endDate);

        if (error) throw error;

        const statusCount = requests?.reduce((acc, request) => {
          acc[request.status] = (acc[request.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        trendsData.push({
          month: monthData.month,
          pending: statusCount['pending'] || 0,
          accepted: statusCount['accepted'] || 0,
          completed: statusCount['completed'] || 0,
          rejected: statusCount['rejected'] || 0
        });
      }

      setMentorshipTrends(trendsData);
    } catch (error) {
      console.error('Error fetching mentorship trends:', error);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access denied</h3>
        <p className="mt-1 text-sm text-gray-500">Only administrators can view analytics.</p>
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

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-green-600 font-medium">
                  {stats.totalStudents} Students, {stats.totalAlumni} Alumni
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
              <p className="text-sm font-medium text-gray-600">Total Posts</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalPosts}</p>
              <div className="mt-2 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">Active community</span>
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
              <p className="text-sm font-medium text-gray-600">Messages</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalMessages}</p>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-blue-600 font-medium">Platform engagement</span>
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
                <span className="text-orange-600 font-medium">
                  {stats.totalMentorshipRequests} total requests
                </span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <UserCheck className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="#3B82F6" fill="#93C5FD" />
              <Area type="monotone" dataKey="students" stroke="#10B981" fill="#6EE7B7" />
              <Area type="monotone" dataKey="alumni" stroke="#F59E0B" fill="#FCD34D" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Post Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Post Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={postDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, percentage }) => `${type} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {postDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Mentorship Trends */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mentorship Request Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mentorshipTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
              <Bar dataKey="accepted" fill="#10B981" name="Accepted" />
              <Bar dataKey="completed" fill="#3B82F6" name="Completed" />
              <Bar dataKey="rejected" fill="#EF4444" name="Rejected" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalUsers > 0 ? Math.round((stats.activeMentorships / stats.totalStudents) * 100) : 0}%
            </div>
            <p className="text-sm text-gray-600 mt-1">Student engagement in mentorship</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.totalUsers > 0 ? Math.round((stats.totalMessages / stats.totalUsers)) : 0}
            </div>
            <p className="text-sm text-gray-600 mt-1">Average messages per user</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalUsers > 0 ? Math.round((stats.totalPosts / stats.totalUsers) * 100) / 100 : 0}
            </div>
            <p className="text-sm text-gray-600 mt-1">Posts per user ratio</p>
          </div>
        </div>
      </div>
    </div>
  );
}