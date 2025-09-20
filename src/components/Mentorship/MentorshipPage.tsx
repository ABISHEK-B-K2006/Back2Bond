import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../types/database';
import { ModernLayout } from '../Layout/ModernLayout';
import { MentorshipRequests } from './MentorshipRequests';
import { MentorshipAvailability } from './MentorshipAvailability';
import { RequestMentorshipModal } from './RequestMentorshipModal';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Filter,
  Search,
  Award,
  Target,
  TrendingUp,
  BookOpen,
  UserCheck,
  UserX,
  Settings
} from 'lucide-react';

type MentorshipRequest = Database['public']['Tables']['mentorship_requests']['Row'] & {
  student: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    course: string | null;
    skills: string[] | null;
  };
  mentor: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    company: string | null;
    position: string | null;
  };
};

type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed';
type MentorshipTab = 'overview' | 'requests' | 'availability' | 'analytics';

export function MentorshipPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<MentorshipTab>('overview');
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [filter, setFilter] = useState<RequestStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    acceptedRequests: 0,
    completedRequests: 0,
    rejectedRequests: 0,
    activeMentorships: 0
  });

  useEffect(() => {
    if (profile) {
      fetchMentorshipData();
    }
  }, [profile]);

  const fetchMentorshipData = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      // Fetch mentorship requests based on user role
      let query = supabase
        .from('mentorship_requests')
        .select(`
          *,
          student:profiles!mentorship_requests_student_id_fkey(id, full_name, avatar_url, course, skills),
          mentor:profiles!mentorship_requests_mentor_id_fkey(id, full_name, avatar_url, company, position)
        `);

      if (profile.role === 'student') {
        query = query.eq('student_id', profile.id);
      } else if (profile.role === 'alumni') {
        query = query.eq('mentor_id', profile.id);
      }
      // Admin can see all requests (no additional filter)

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const requests = (data || []).map((request: any) => ({
        ...request,
        student: Array.isArray(request.student) ? request.student[0] : request.student,
        mentor: Array.isArray(request.mentor) ? request.mentor[0] : request.mentor
      })) as MentorshipRequest[];

      setMentorshipRequests(requests);
      calculateStats(requests);
    } catch (error) {
      console.error('Error fetching mentorship data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (requests: MentorshipRequest[]) => {
    const totalRequests = requests.length;
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const acceptedRequests = requests.filter(r => r.status === 'accepted').length;
    const completedRequests = requests.filter(r => r.status === 'completed').length;
    const rejectedRequests = requests.filter(r => r.status === 'rejected').length;
    const activeMentorships = acceptedRequests; // Active = accepted but not completed

    setStats({
      totalRequests,
      pendingRequests,
      acceptedRequests,
      completedRequests,
      rejectedRequests,
      activeMentorships
    });
  };

  const getFilteredRequests = () => {
    let filtered = mentorshipRequests;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(request => request.status === filter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(request => {
        const studentName = request.student?.full_name?.toLowerCase() || '';
        const mentorName = request.mentor?.full_name?.toLowerCase() || '';
        const message = request.message?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        
        return studentName.includes(search) || 
               mentorName.includes(search) || 
               message.includes(search);
      });
    }

    return filtered;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'completed':
        return <Award className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canRequestMentorship = profile?.role === 'student';
  const canManageAvailability = profile?.role === 'alumni';
  const filteredRequests = getFilteredRequests();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ModernLayout activeTab="mentorship">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mentorship Center</h1>
              <p className="text-gray-600">
                {profile?.role === 'student' 
                  ? 'Connect with alumni mentors to advance your career'
                  : profile?.role === 'alumni' 
                  ? 'Share your expertise and guide the next generation'
                  : 'Manage and oversee mentorship relationships'
                }
              </p>
            </div>
            {canRequestMentorship && (
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Request Mentorship
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeMentorships}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedRequests}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Overview</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Requests</span>
                  {stats.pendingRequests > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {stats.pendingRequests}
                    </span>
                  )}
                </div>
              </button>

              {canManageAvailability && (
                <button
                  onClick={() => setActiveTab('availability')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'availability'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Availability</span>
                  </div>
                </button>
              )}

              {profile?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'analytics'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Analytics</span>
                  </div>
                </button>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {canRequestMentorship && (
                      <button
                        onClick={() => setShowRequestModal(true)}
                        className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                      >
                        <Plus className="h-8 w-8 text-blue-600 mb-2" />
                        <h4 className="font-medium text-gray-900">Request Mentorship</h4>
                        <p className="text-sm text-gray-600">Connect with an alumni mentor</p>
                      </button>
                    )}
                    
                    <button
                      onClick={() => setActiveTab('requests')}
                      className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-left"
                    >
                      <BookOpen className="h-8 w-8 text-green-600 mb-2" />
                      <h4 className="font-medium text-gray-900">View Requests</h4>
                      <p className="text-sm text-gray-600">Manage mentorship requests</p>
                    </button>

                    {canManageAvailability && (
                      <button
                        onClick={() => setActiveTab('availability')}
                        className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-left"
                      >
                        <Calendar className="h-8 w-8 text-purple-600 mb-2" />
                        <h4 className="font-medium text-gray-900">Set Availability</h4>
                        <p className="text-sm text-gray-600">Manage your mentoring schedule</p>
                      </button>
                    )}
                  </div>
                </div>

                {/* Recent Requests Preview */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Recent Requests</h3>
                    <button
                      onClick={() => setActiveTab('requests')}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View All
                    </button>
                  </div>
                  
                  {mentorshipRequests.slice(0, 3).length > 0 ? (
                    <div className="space-y-3">
                      {mentorshipRequests.slice(0, 3).map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(request.status)}
                            <div>
                              <p className="font-medium text-gray-900">
                                {profile?.role === 'alumni' 
                                  ? request.student?.full_name 
                                  : request.mentor?.full_name
                                }
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No requests yet</h4>
                      <p className="text-gray-600">
                        {canRequestMentorship 
                          ? "Start by requesting mentorship from an alumni"
                          : "Mentorship requests will appear here"
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as RequestStatus | 'all')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Requests Component */}
                <MentorshipRequests />
              </div>
            )}

            {activeTab === 'availability' && canManageAvailability && (
              <MentorshipAvailability />
            )}

            {activeTab === 'analytics' && profile?.role === 'admin' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Mentorship Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-2">Success Rate</h4>
                    <p className="text-3xl font-bold text-green-600">
                      {stats.totalRequests > 0 
                        ? Math.round((stats.completedRequests / stats.totalRequests) * 100)
                        : 0
                      }%
                    </p>
                    <p className="text-sm text-gray-600">Completed mentorships</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-2">Average Response Time</h4>
                    <p className="text-3xl font-bold text-blue-600">2.3</p>
                    <p className="text-sm text-gray-600">Days to respond</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Mentorship Modal - Only show if we have an alumni selected */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Request Mentorship</h3>
              <p className="text-gray-600 mb-4">
                To request mentorship, please go to the Alumni Search page to find and connect with specific alumni mentors.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    // Navigate to alumni search - you can implement this
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Find Alumni
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}