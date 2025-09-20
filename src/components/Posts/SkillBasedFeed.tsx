import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Hash, 
  Filter, 
  Users, 
  Target, 
  TrendingUp,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import { PostCard } from './PostCard';
import { RichMediaPostModal } from './RichMediaPostModal';

interface Post {
  id: string;
  title: string;
  content: string;
  type: 'common' | 'student_only' | 'alumni_only' | 'announcement' | 'community';
  media_urls?: string[] | null;
  media_type?: 'text' | 'image' | 'video' | 'mixed' | null;
  target_skills?: string[] | null;
  visibility?: 'public' | 'connections' | 'private';
  created_at: string;
  author_id: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
    role: 'admin' | 'student' | 'alumni';
  };
}

export function SkillBasedFeed() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [feedType, setFeedType] = useState<'all' | 'targeted' | 'trending'>('all');

  useEffect(() => {
    fetchPosts();
    fetchAvailableSkills();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, selectedSkills, feedType, profile]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(full_name, avatar_url, role, company, course)
        `)
        .or('type.eq.community,type.eq.common')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Format the data to ensure author is properly available
      const formattedPosts = (data || []).map((post: any) => ({
        ...post,
        author: Array.isArray(post.author) ? post.author[0] : post.author
      }));
      
      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSkills = async () => {
    try {
      // Get skills from posts
      const { data: postSkills } = await supabase
        .from('posts')
        .select('target_skills')
        .not('target_skills', 'is', null);

      // Get skills from user profiles
      const { data: profileSkills } = await supabase
        .from('profiles')
        .select('skills')
        .not('skills', 'is', null);

      const allSkills = new Set<string>();
      
      postSkills?.forEach((post: any) => {
        if (post.target_skills) {
          (post.target_skills as string[]).forEach(skill => allSkills.add(skill));
        }
      });

      profileSkills?.forEach((profile: any) => {
        if (profile.skills) {
          (profile.skills as string[]).forEach(skill => allSkills.add(skill));
        }
      });

      setAvailableSkills(Array.from(allSkills).sort());
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const filterPosts = () => {
    let filtered = posts;

    if (feedType === 'targeted' && profile?.skills) {
      // Show posts targeted to user's skills or general community posts
      filtered = posts.filter(post => {
        if (post.type === 'common') return true;
        if (post.type === 'community' && post.target_skills) {
          return post.target_skills.some(skill => 
            (profile.skills || []).includes(skill)
          );
        }
        return false;
      });
    } else if (feedType === 'trending') {
      // Sort by recent activity or engagement (simplified)
      filtered = [...posts].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 20);
    }

    if (selectedSkills.length > 0) {
      filtered = filtered.filter(post => {
        if (post.type === 'community' && post.target_skills) {
          return selectedSkills.some(skill => 
            post.target_skills?.includes(skill)
          );
        }
        return post.type === 'common' && selectedSkills.length === 0;
      });
    }

    setFilteredPosts(filtered);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const getSkillStats = (skill: string) => {
    const postsWithSkill = posts.filter(post => 
      post.target_skills?.includes(skill)
    ).length;
    return postsWithSkill;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Skill-Based Community</h2>
          <p className="text-gray-600">Discover content tailored to your expertise and interests</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Hash className="h-4 w-4 mr-2" />
          Create Community Post
        </button>
      </div>

      {/* Feed Type Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Feed Type:</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setFeedType('all')}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                feedType === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="h-4 w-4 inline mr-1" />
              All Posts
            </button>
            <button
              onClick={() => setFeedType('targeted')}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                feedType === 'targeted'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Target className="h-4 w-4 inline mr-1" />
              For You
            </button>
            <button
              onClick={() => setFeedType('trending')}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                feedType === 'trending'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-1" />
              Trending
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Skills Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4">
            <div className="flex items-center space-x-2 mb-4">
              <Hash className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Skills & Topics</h3>
            </div>
            
            {/* User's Skills */}
            {profile?.skills && profile.skills.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Your Skills</h4>
                <div className="space-y-2">
                  {profile.skills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedSkills.includes(skill)
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{skill}</span>
                        <span className="text-xs text-gray-500">
                          {getSkillStats(skill)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All Available Skills */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">All Topics</h4>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {availableSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedSkills.includes(skill)
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{skill}</span>
                      <span className="text-xs text-gray-500">
                        {getSkillStats(skill)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {selectedSkills.length > 0 && (
              <button
                onClick={() => setSelectedSkills([])}
                className="w-full mt-4 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Clear Filters ({selectedSkills.length})
              </button>
            )}
          </div>
        </div>

        {/* Posts Feed */}
        <div className="lg:col-span-3 space-y-6">
          {/* Selected Skills Display */}
          {selectedSkills.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Filtering by skills:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {skill}
                    <button
                      onClick={() => toggleSkill(skill)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Posts */}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                {selectedSkills.length > 0 ? (
                  <Hash className="h-12 w-12" />
                ) : (
                  <BookOpen className="h-12 w-12" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedSkills.length > 0 
                  ? 'No posts found for selected skills'
                  : 'No community posts yet'
                }
              </h3>
              <p className="text-gray-500 mb-4">
                {selectedSkills.length > 0
                  ? 'Try selecting different skills or create the first post for these topics.'
                  : 'Be the first to share knowledge with the community.'
                }
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Create Community Post
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <div key={post.id} className="relative">
                  {/* Skill Tags for Community Posts */}
                  {post.type === 'community' && post.target_skills && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {post.target_skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                        >
                          <Hash className="h-3 w-3 mr-1" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      <RichMediaPostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={fetchPosts}
      />
    </div>
  );
}