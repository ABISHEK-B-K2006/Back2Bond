import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  MapPin, 
  Briefcase, 
  Calendar, 
  GraduationCap, 
  MessageCircle, 
  UserPlus, 
  Heart, 
  User, 
  Clock, 
  Star, 
  Award, 
  Building, 
  Eye,
  X,
  Check
} from 'lucide-react';
import { RequestMentorshipModal } from '../Mentorship/RequestMentorshipModal';

interface Alumni {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  skills: string[] | null;
  graduation_year: number | null;
  current_position: string | null;
  company: string | null;
  created_at: string;
  updated_at: string;
  is_open_to_mentor?: boolean;
  availability_hours?: any;
  specialization_areas?: string[];
}

interface MentorshipAvailability {
  id: string;
  alumni_id: string;
  available_days: string[];
  available_hours: { start: string; end: string };
  session_duration: number;
  max_mentees_per_month: number;
  specialization_areas: string[];
  preferred_communication: string;
  timezone: string;
  is_active: boolean;
}

interface SearchFilters {
  searchTerm: string;
  skills: string[];
  graduationYear: string;
  company: string;
  position: string;
  mentorshipAvailable: boolean;
}

export function EnhancedAlumniSearch() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [filteredAlumni, setFilteredAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [showMentorshipModal, setShowMentorshipModal] = useState(false);
  const [connectionRequests, setConnectionRequests] = useState<Set<string>>(new Set());
  const [connections, setConnections] = useState<Set<string>>(new Set());
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [mentorshipAvailability, setMentorshipAvailability] = useState<Map<string, MentorshipAvailability>>(new Map());
  
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    skills: [],
    graduationYear: '',
    company: '',
    position: '',
    mentorshipAvailable: false
  });

  useEffect(() => {
    fetchAlumni();
    fetchConnections();
    fetchMentorshipAvailability();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [alumni, filters]);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'alumni')
        .order('full_name');

      if (error) throw error;

      setAlumni(data || []);
      
      // Extract all unique skills for filter options
      const allSkills = new Set<string>();
      data?.forEach((alumnus: any) => {
        alumnus.skills?.forEach((skill: string) => allSkills.add(skill));
      });
      setAvailableSkills(Array.from(allSkills).sort());
      
    } catch (error) {
      console.error('Error fetching alumni:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    if (!profile) return;

    try {
      // Fetch existing connections
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('connections')
        .select('connected_user_id')
        .eq('user_id', profile.id)
        .eq('status', 'accepted');

      if (!connectionsError) {
        const connectedIds = new Set(connectionsData?.map((c: any) => c.connected_user_id) || []);
        setConnections(connectedIds);
      }

      // Fetch pending connection requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('connection_requests')
        .select('recipient_id')
        .eq('sender_id', profile.id)
        .eq('status', 'pending');

      if (!requestsError) {
        const requestIds = new Set(requestsData?.map((r: any) => r.recipient_id) || []);
        setConnectionRequests(requestIds);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const fetchMentorshipAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('mentorship_availability')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const availabilityMap = new Map();
      data?.forEach((availability: any) => {
        availabilityMap.set(availability.alumni_id, availability);
      });
      setMentorshipAvailability(availabilityMap);
    } catch (error) {
      console.error('Error fetching mentorship availability:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...alumni];

    // Search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(alumnus =>
        alumnus.full_name.toLowerCase().includes(term) ||
        alumnus.bio?.toLowerCase().includes(term) ||
        alumnus.company?.toLowerCase().includes(term) ||
        alumnus.current_position?.toLowerCase().includes(term) ||
        alumnus.skills?.some(skill => skill.toLowerCase().includes(term))
      );
    }

    // Skills filter
    if (filters.skills.length > 0) {
      filtered = filtered.filter(alumnus =>
        alumnus.skills?.some(skill => filters.skills.includes(skill))
      );
    }

    // Graduation year filter
    if (filters.graduationYear) {
      filtered = filtered.filter(alumnus =>
        alumnus.graduation_year?.toString() === filters.graduationYear
      );
    }

    // Company filter
    if (filters.company) {
      const company = filters.company.toLowerCase();
      filtered = filtered.filter(alumnus =>
        alumnus.company?.toLowerCase().includes(company)
      );
    }

    // Position filter
    if (filters.position) {
      const position = filters.position.toLowerCase();
      filtered = filtered.filter(alumnus =>
        alumnus.current_position?.toLowerCase().includes(position)
      );
    }

    // Mentorship availability filter
    if (filters.mentorshipAvailable) {
      filtered = filtered.filter(alumnus =>
        mentorshipAvailability.has(alumnus.id)
      );
    }

    setFilteredAlumni(filtered);
  };

  const handleSkillToggle = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      skills: [],
      graduationYear: '',
      company: '',
      position: '',
      mentorshipAvailable: false
    });
  };

  const handleConnect = async (alumniId: string) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('connection_requests')
        .insert({
          sender_id: profile.id,
          recipient_id: alumniId,
          status: 'pending'
        } as any);

      if (error) throw error;

      setConnectionRequests(prev => new Set([...prev, alumniId]));

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: alumniId,
          type: 'connection',
          title: 'New Connection Request',
          content: `${profile.full_name} wants to connect with you`,
          related_id: profile.id
        } as any);
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  const handleMessage = (alumniId: string) => {
    navigate(`/messages?user=${alumniId}`);
  };

  const handleRequestMentorship = (alumnus: Alumni) => {
    setSelectedAlumni(alumnus);
    setShowMentorshipModal(true);
  };

  const getUniqueGraduationYears = () => {
    const years = alumni
      .map(a => a.graduation_year)
      .filter(year => year !== null)
      .sort((a, b) => (b as number) - (a as number));
    return [...new Set(years)];
  };

  const renderMentorshipAvailability = (alumniId: string) => {
    const availability = mentorshipAvailability.get(alumniId);
    if (!availability) return null;

    return (
      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">Available for Mentorship</span>
        </div>
        <div className="text-xs text-green-700 space-y-1">
          <div>Days: {availability.available_days.join(', ')}</div>
          <div>Hours: {availability.available_hours.start} - {availability.available_hours.end}</div>
          <div>Duration: {availability.session_duration} minutes</div>
          {availability.specialization_areas.length > 0 && (
            <div>Areas: {availability.specialization_areas.join(', ')}</div>
          )}
        </div>
      </div>
    );
  };

  const getConnectionStatus = (alumniId: string) => {
    if (connections.has(alumniId)) return 'connected';
    if (connectionRequests.has(alumniId)) return 'pending';
    return 'none';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Discover Alumni</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with alumni, find mentors, and expand your professional network
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, company, skills, or position..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl border font-medium transition-colors ${
                showFilters 
                  ? 'bg-blue-100 text-blue-700 border-blue-200' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Graduation Year Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
                  <select
                    value={filters.graduationYear}
                    onChange={(e) => setFilters({ ...filters, graduationYear: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All years</option>
                    {getUniqueGraduationYears().map(year => (
                      <option key={year} value={year?.toString()}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Company Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    placeholder="Enter company name"
                    value={filters.company}
                    onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Position Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                  <input
                    type="text"
                    placeholder="Enter position"
                    value={filters.position}
                    onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Mentorship Toggle */}
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.mentorshipAvailable}
                    onChange={(e) => setFilters({ ...filters, mentorshipAvailable: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Show only mentors available</span>
                </label>
              </div>

              {/* Skills Filter */}
              {availableSkills.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {availableSkills.slice(0, 20).map(skill => (
                      <button
                        key={skill}
                        onClick={() => handleSkillToggle(skill)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          filters.skills.includes(skill)
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear Filters */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredAlumni.length} of {alumni.length} alumni
          </p>
        </div>

        {/* Alumni Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlumni.map((alumnus) => {
            const connectionStatus = getConnectionStatus(alumnus.id);
            const hasMentorship = mentorshipAvailability.has(alumnus.id);
            
            return (
              <div key={alumnus.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                {/* Profile Header */}
                <div className="relative">
                  <div className="h-24 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient-x"></div>
                  <div className="absolute -bottom-12 left-6">
                    {alumnus.avatar_url ? (
                      <img
                        src={alumnus.avatar_url}
                        alt={alumnus.full_name}
                        className="h-24 w-24 rounded-full border-4 border-white object-cover"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center">
                        <User className="h-8 w-8 text-gray-500" />
                      </div>
                    )}
                  </div>
                  {hasMentorship && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        Mentor
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Content */}
                <div className="pt-16 px-6 pb-6">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{alumnus.full_name}</h3>
                    {alumnus.current_position && (
                      <p className="text-blue-600 font-medium">{alumnus.current_position}</p>
                    )}
                    {alumnus.company && (
                      <p className="text-gray-600 flex items-center justify-center mt-1">
                        <Building className="h-4 w-4 mr-1" />
                        {alumnus.company}
                      </p>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    {alumnus.graduation_year && (
                      <div className="flex items-center text-gray-600">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        <span className="text-sm">Class of {alumnus.graduation_year}</span>
                      </div>
                    )}
                    {alumnus.bio && (
                      <p className="text-gray-700 text-sm line-clamp-3">{alumnus.bio}</p>
                    )}
                  </div>

                  {/* Skills */}
                  {alumnus.skills && alumnus.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {alumnus.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {alumnus.skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{alumnus.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mentorship Availability */}
                  {renderMentorshipAvailability(alumnus.id)}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 mt-4">
                    {connectionStatus === 'none' && (
                      <button
                        onClick={() => handleConnect(alumnus.id)}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>Connect</span>
                      </button>
                    )}
                    
                    {connectionStatus === 'pending' && (
                      <button
                        disabled
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg cursor-not-allowed"
                      >
                        <Clock className="h-4 w-4" />
                        <span>Pending</span>
                      </button>
                    )}
                    
                    {connectionStatus === 'connected' && (
                      <button
                        disabled
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg cursor-not-allowed"
                      >
                        <Check className="h-4 w-4" />
                        <span>Connected</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleMessage(alumnus.id)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>

                    {hasMentorship && (
                      <button
                        onClick={() => handleRequestMentorship(alumnus)}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <Award className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredAlumni.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alumni found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search criteria or filters.
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Mentorship Request Modal */}
      {showMentorshipModal && selectedAlumni && (
        <RequestMentorshipModal
          isOpen={showMentorshipModal}
          onClose={() => {
            setShowMentorshipModal(false);
            setSelectedAlumni(null);
          }}
          alumni={selectedAlumni}
          onRequestSent={() => {
            setShowMentorshipModal(false);
            setSelectedAlumni(null);
          }}
        />
      )}
    </div>
  );
}