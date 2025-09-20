import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, 
  MessageCircle, 
  UserPlus, 
  Heart, 
  MapPin, 
  Calendar, 
  Briefcase, 
  GraduationCap,
  Mail,
  Phone,
  Globe,
  Github,
  Linkedin,
  Edit
} from 'lucide-react';
import { PostCard } from '../Posts/PostCard';
import { RequestMentorshipModal } from '../Mentorship/RequestMentorshipModal';
import { NewMessageModal } from '../Messaging/NewMessageModal';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'student' | 'alumni';
  avatar_url: string | null;
  bio: string | null;
  skills: string[] | null;
  graduation_year: number | null;
  current_position: string | null;
  company: string | null;
  course: string | null;
  year: number | null;
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  type: 'common' | 'student_only' | 'alumni_only' | 'announcement';
  created_at: string;
  updated_at: string;
  author_id: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
    role: 'admin' | 'student' | 'alumni';
  };
}

interface Stats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  mentorshipCount: number;
}

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { profile: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<Stats>({
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
    mentorshipCount: 0
  });
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
  const [showMentorshipModal, setShowMentorshipModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProfileData();
    }
  }, [userId]);

  const fetchProfileData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchPosts(),
        fetchStats(),
        checkFollowStatus()
      ]);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchPosts = async () => {
    if (!userId || !currentUser) return;

    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(full_name, avatar_url, role)
        `)
        .eq('author_id', userId);

      // Filter posts based on current user role and post visibility
      if (currentUser.role === 'student') {
        query = query.in('type', ['common', 'student_only', 'announcement']);
      } else if (currentUser.role === 'alumni') {
        query = query.in('type', ['common', 'alumni_only', 'announcement']);
      }
      // Admins can see all posts

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchStats = async () => {
    if (!userId) return;

    try {
      // Posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId);

      // Followers count
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      // Following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      // Mentorship count
      let mentorshipCount = 0;
      if (profile?.role === 'student') {
        const { count } = await supabase
          .from('mentorship_requests')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', userId);
        mentorshipCount = count || 0;
      } else if (profile?.role === 'alumni') {
        const { count } = await supabase
          .from('mentorship_requests')
          .select('*', { count: 'exact', head: true })
          .eq('alumni_id', userId)
          .eq('status', 'accepted');
        mentorshipCount = count || 0;
      }

      setStats({
        postsCount: postsCount || 0,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        mentorshipCount
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const checkFollowStatus = async () => {
    if (!userId || !currentUser || userId === currentUser.id) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !userId || userId === currentUser.id) return;

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId);

        if (error) throw error;
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followersCount: prev.followersCount - 1 }));
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: userId
          });

        if (error) throw error;

        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'post',
            title: 'New Follower',
            content: `${currentUser.full_name} started following you`,
            related_id: currentUser.id
          });

        setIsFollowing(true);
        setStats(prev => ({ ...prev, followersCount: prev.followersCount + 1 }));
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
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

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const canViewProfile = () => {
    if (!profile || !currentUser) return false;
    
    // Admins can view all profiles
    if (currentUser.role === 'admin') return true;
    
    // Users can view their own profile
    if (profile.id === currentUser.id) return true;
    
    // Students can view alumni profiles
    if (currentUser.role === 'student' && profile.role === 'alumni') return true;
    
    // Alumni can view student profiles
    if (currentUser.role === 'alumni' && profile.role === 'student') return true;
    
    return false;
  };

  const canInteract = () => {
    return currentUser && profile && currentUser.id !== profile.id && canViewProfile();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile || !canViewProfile()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">This profile doesn't exist or you don't have permission to view it.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          
          {currentUser?.id === profile.id && (
            <button
              onClick={() => navigate('/profile/edit')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <img
                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=6366f1&color=ffffff`}
                alt={profile.full_name}
                className="w-24 h-24 rounded-full mx-auto md:mx-0"
              />
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{profile.full_name}</h1>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleColor(profile.role)}`}>
                      {getRoleLabel(profile.role)}
                    </span>
                  </div>
                  
                  {canInteract() && (
                    <div className="flex items-center space-x-3 mt-4 md:mt-0">
                      <button
                        onClick={handleFollow}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                          isFollowing
                            ? 'text-red-700 bg-red-50 hover:bg-red-100'
                            : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
                        <span>{isFollowing ? 'Unfollow' : 'Follow'}</span>
                      </button>
                      
                      <button
                        onClick={() => setShowMessageModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Message</span>
                      </button>
                      
                      {currentUser?.role === 'student' && profile.role === 'alumni' && (
                        <button
                          onClick={() => setShowMentorshipModal(true)}
                          className="flex items-center space-x-2 px-4 py-2 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                        >
                          <UserPlus className="h-4 w-4" />
                          <span>Request Mentorship</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  {profile.role === 'student' && (
                    <>
                      {profile.course && (
                        <div className="flex items-center">
                          <GraduationCap className="h-4 w-4 mr-2" />
                          <span>{profile.course}</span>
                        </div>
                      )}
                      {profile.year && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Year {profile.year}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {profile.role === 'alumni' && (
                    <>
                      {profile.current_position && (
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-2" />
                          <span>{profile.current_position}</span>
                        </div>
                      )}
                      {profile.company && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{profile.company}</span>
                        </div>
                      )}
                      {profile.graduation_year && (
                        <div className="flex items-center">
                          <GraduationCap className="h-4 w-4 mr-2" />
                          <span>Class of {profile.graduation_year}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Stats */}
                <div className="flex justify-center md:justify-start space-x-8 mt-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{stats.postsCount}</div>
                    <div className="text-sm text-gray-500">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{stats.followersCount}</div>
                    <div className="text-sm text-gray-500">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{stats.followingCount}</div>
                    <div className="text-sm text-gray-500">Following</div>
                  </div>
                  {profile.role !== 'admin' && (
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-900">{stats.mentorshipCount}</div>
                      <div className="text-sm text-gray-500">
                        {profile.role === 'student' ? 'Requests' : 'Mentorships'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex space-x-1 p-1">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'posts'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Posts ({stats.postsCount})
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'about'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              About
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-500">
                  {currentUser?.id === profile.id 
                    ? "You haven't created any posts yet." 
                    : `${profile.full_name} hasn't posted anything yet.`
                  }
                </p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-6">
              {/* Bio */}
              {profile.bio && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                  <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-700">{profile.email}</span>
                  </div>
                  
                  {profile.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-gray-700">{profile.phone}</span>
                    </div>
                  )}
                  
                  {profile.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-gray-700">{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Links */}
              {(profile.linkedin_url || profile.github_url || profile.website_url) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Links</h3>
                  <div className="space-y-2">
                    {profile.linkedin_url && (
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Linkedin className="h-4 w-4 mr-3" />
                        <span>LinkedIn Profile</span>
                      </a>
                    )}
                    
                    {profile.github_url && (
                      <a
                        href={profile.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-gray-900 transition-colors"
                      >
                        <Github className="h-4 w-4 mr-3" />
                        <span>GitHub Profile</span>
                      </a>
                    )}
                    
                    {profile.website_url && (
                      <a
                        href={profile.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-green-600 hover:text-green-800 transition-colors"
                      >
                        <Globe className="h-4 w-4 mr-3" />
                        <span>Personal Website</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Member Since */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Member Since</h3>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-gray-700">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showMentorshipModal && profile.role === 'alumni' && (
        <RequestMentorshipModal
          isOpen={showMentorshipModal}
          onClose={() => setShowMentorshipModal(false)}
          alumni={profile as any}
          onRequestSent={() => {
            console.log('Mentorship request sent!');
          }}
        />
      )}

      {showMessageModal && (
        <NewMessageModal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          onMessageSent={() => {
            console.log('Message sent!');
          }}
        />
      )}
    </div>
  );
}