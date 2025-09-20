import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Check, X, Clock, MessageCircle, User, GraduationCap, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MentorshipRequest {
  id: string;
  student_id: string;
  alumni_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    course: string | null;
    year: number | null;
    bio: string | null;
  };
  alumni?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    company: string | null;
    current_position: string | null;
    bio: string | null;
  };
}

export function MentorshipRequests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'completed'>('all');

  useEffect(() => {
    if (profile) {
      fetchRequests();
      
      // Subscribe to real-time updates
      const subscription = supabase
        .channel('mentorship_requests')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'mentorship_requests',
            filter: `or(student_id.eq.${profile.id},alumni_id.eq.${profile.id})`
          }, 
          () => {
            fetchRequests();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [profile, activeTab]);

  const fetchRequests = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('mentorship_requests')
        .select(`
          *,
          student:profiles!mentorship_requests_student_id_fkey(id, full_name, avatar_url, course, year, bio),
          alumni:profiles!mentorship_requests_alumni_id_fkey(id, full_name, avatar_url, company, current_position, bio)
        `);

      // Filter based on active tab
      if (activeTab === 'received') {
        if (profile.role === 'alumni') {
          query = query.eq('alumni_id', profile.id);
        } else if (profile.role === 'admin') {
          // Admins can see all requests
        } else {
          // Students don't receive mentorship requests
          setRequests([]);
          setLoading(false);
          return;
        }
      } else {
        // Sent requests
        if (profile.role === 'student') {
          query = query.eq('student_id', profile.id);
        } else {
          // Alumni and admins don't send requests
          setRequests([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching mentorship requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('mentorship_requests')
        .update({ 
          status: action,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Create notification for student
      const request = requests.find(r => r.id === requestId);
      if (request) {
        await supabase
          .from('notifications')
          .insert({
            user_id: request.student_id,
            type: 'mentorship',
            title: `Mentorship Request ${action}`,
            content: `Your mentorship request has been ${action} by ${profile?.full_name}`,
            related_id: requestId
          });
      }

      await fetchRequests();
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  const handleCompleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('mentorship_requests')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Create notification for both parties
      const request = requests.find(r => r.id === requestId);
      if (request) {
        const notifications = [
          {
            user_id: request.student_id,
            type: 'mentorship' as const,
            title: 'Mentorship Completed',
            content: `Your mentorship with ${request.alumni?.full_name} has been marked as completed`,
            related_id: requestId
          },
          {
            user_id: request.alumni_id,
            type: 'mentorship' as const,
            title: 'Mentorship Completed',
            content: `Your mentorship with ${request.student?.full_name} has been marked as completed`,
            related_id: requestId
          }
        ];

        await supabase.from('notifications').insert(notifications);
      }

      await fetchRequests();
    } catch (error) {
      console.error('Error completing request:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'accepted': return <Check className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      case 'completed': return <GraduationCap className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredRequests = statusFilter === 'all' 
    ? requests 
    : requests.filter(request => request.status === statusFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const canSeeRequests = profile?.role === 'alumni' || profile?.role === 'admin' || 
    (profile?.role === 'student' && activeTab === 'sent');

  if (!canSeeRequests) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No access</h3>
        <p className="mt-1 text-sm text-gray-500">You don't have permission to view this section.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Mentorship Requests</h2>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="ml-4 text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex space-x-1">
            {(profile?.role === 'alumni' || profile?.role === 'admin') && (
              <button
                onClick={() => setActiveTab('received')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'received'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Received Requests
              </button>
            )}
            {(profile?.role === 'student' || profile?.role === 'admin') && (
              <button
                onClick={() => setActiveTab('sent')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'sent'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Sent Requests
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No requests</h3>
            <p className="mt-1 text-sm text-gray-500">
              {statusFilter === 'all' 
                ? `No ${activeTab} mentorship requests yet.`
                : `No ${statusFilter} requests found.`
              }
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const isReceived = activeTab === 'received';
            const otherUser = isReceived ? request.student : request.alumni;
            
            return (
              <div key={request.id} className="p-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.full_name || '')}&background=6366f1&color=ffffff`}
                    alt={otherUser?.full_name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{otherUser?.full_name}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          {isReceived ? (
                            <>
                              <span className="text-sm text-gray-500 flex items-center">
                                <GraduationCap className="h-4 w-4 mr-1" />
                                {request.student?.course} {request.student?.year && `- Year ${request.student.year}`}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-sm text-gray-500 flex items-center">
                                <Briefcase className="h-4 w-4 mr-1" />
                                {request.alumni?.current_position} {request.alumni?.company && `at ${request.alumni.company}`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{request.status.toUpperCase()}</span>
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm text-gray-700">{request.message}</p>
                    </div>

                    {otherUser?.bio && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 italic">"{otherUser.bio}"</p>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </span>

                      {/* Action Buttons */}
                      {isReceived && request.status === 'pending' && profile?.role === 'alumni' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRequestAction(request.id, 'rejected')}
                            className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleRequestAction(request.id, 'accepted')}
                            className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            Accept
                          </button>
                        </div>
                      )}

                      {request.status === 'accepted' && (
                        <button
                          onClick={() => handleCompleteRequest(request.id)}
                          className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          Mark as Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}