import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Linkedin, ExternalLink, Sync, AlertCircle, CheckCircle } from 'lucide-react';

interface LinkedInData {
  name: string;
  headline: string;
  location: string;
  industry: string;
  summary: string;
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate?: string;
  }>;
  skills: string[];
  profileUrl: string;
}

interface LinkedInIntegrationProps {
  onDataSync?: (data: LinkedInData) => void;
}

export function LinkedInIntegration({ onDataSync }: LinkedInIntegrationProps) {
  const { profile } = useAuth();
  const [linkedInUrl, setLinkedInUrl] = useState(profile?.linkedin_url || '');
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  const validateLinkedInUrl = (url: string) => {
    const linkedInRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    return linkedInRegex.test(url);
  };

  const saveLinkedInUrl = async () => {
    if (!profile || !linkedInUrl.trim()) return;

    if (!validateLinkedInUrl(linkedInUrl)) {
      setError('Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/yourname)');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ linkedin_url: linkedInUrl.trim() })
        .eq('id', profile.id);

      if (error) throw error;

      setSuccess('LinkedIn URL saved successfully!');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to save LinkedIn URL');
    }
  };

  // Simulated LinkedIn data extraction (in real implementation, this would use LinkedIn API)
  const simulateLinkedInDataExtraction = async (url: string): Promise<LinkedInData> => {
    // This is a mock implementation. In a real application, you would:
    // 1. Use LinkedIn API with proper OAuth authentication
    // 2. Or use a third-party service that can extract LinkedIn data
    // 3. Or implement web scraping (though this is against LinkedIn's ToS)
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    
    // Mock data based on common LinkedIn profile structure
    return {
      name: profile?.full_name || 'LinkedIn User',
      headline: 'Software Engineer | React Developer',
      location: 'San Francisco, CA',
      industry: 'Technology',
      summary: 'Passionate software engineer with experience in building scalable web applications...',
      experience: [
        {
          company: 'Tech Corp',
          title: 'Senior Software Engineer',
          startDate: '2022-01',
          description: 'Led development of React applications and mentored junior developers.'
        },
        {
          company: 'Startup Inc',
          title: 'Full Stack Developer',
          startDate: '2020-06',
          endDate: '2021-12',
          description: 'Developed full-stack applications using React, Node.js, and PostgreSQL.'
        }
      ],
      education: [
        {
          school: 'University of Technology',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2016-09',
          endDate: '2020-05'
        }
      ],
      skills: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'PostgreSQL', 'Python', 'AWS'],
      profileUrl: url
    };
  };

  const syncLinkedInData = async () => {
    if (!profile || !linkedInUrl.trim()) return;

    if (!validateLinkedInUrl(linkedInUrl)) {
      setError('Please enter a valid LinkedIn profile URL first');
      return;
    }

    setSyncing(true);
    setError('');
    setSuccess('');

    try {
      // Simulate LinkedIn data extraction
      const linkedInData = await simulateLinkedInDataExtraction(linkedInUrl);

      // Update profile with LinkedIn data
      const profileUpdates: any = {
        linkedin_url: linkedInUrl,
        updated_at: new Date().toISOString()
      };

      // Map LinkedIn data to profile fields
      if (linkedInData.location) {
        profileUpdates.location = linkedInData.location;
      }

      if (linkedInData.summary && !profile.bio) {
        profileUpdates.bio = linkedInData.summary;
      }

      if (linkedInData.skills && linkedInData.skills.length > 0) {
        profileUpdates.skills = linkedInData.skills;
      }

      // For alumni, update company and position from latest experience
      if (profile.role === 'alumni' && linkedInData.experience.length > 0) {
        const latestExperience = linkedInData.experience[0];
        profileUpdates.company = latestExperience.company;
        profileUpdates.current_position = latestExperience.title;
      }

      const { error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', profile.id);

      if (error) throw error;

      setSuccess('Profile synced with LinkedIn data successfully!');
      onDataSync?.(linkedInData);
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error: any) {
      console.error('Error syncing LinkedIn data:', error);
      setError(error.message || 'Failed to sync LinkedIn data');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className=\"bg-white rounded-lg shadow-sm border border-gray-200 p-6\">
      <div className=\"flex items-center justify-between mb-4\">
        <div className=\"flex items-center space-x-3\">
          <div className=\"p-2 bg-blue-100 rounded-lg\">
            <Linkedin className=\"h-6 w-6 text-blue-600\" />
          </div>
          <div>
            <h3 className=\"text-lg font-semibold text-gray-900\">LinkedIn Integration</h3>
            <p className=\"text-sm text-gray-600\">Sync your LinkedIn profile data</p>
          </div>
        </div>
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className=\"text-sm text-blue-600 hover:text-blue-800 transition-colors\"
        >
          How it works
        </button>
      </div>

      {showInstructions && (
        <div className=\"mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg\">
          <h4 className=\"font-medium text-blue-900 mb-2\">How LinkedIn Integration Works:</h4>
          <ol className=\"list-decimal list-inside space-y-1 text-sm text-blue-800\">
            <li>Enter your LinkedIn profile URL (e.g., https://linkedin.com/in/yourname)</li>
            <li>Click \"Sync LinkedIn Data\" to import your professional information</li>
            <li>Your profile will be updated with skills, experience, and bio from LinkedIn</li>
            <li>You can manually edit any imported information later</li>
          </ol>
          <p className=\"mt-2 text-xs text-blue-700\">
            Note: This is a demo implementation. In production, proper LinkedIn API authentication would be required.
          </p>
        </div>
      )}

      {error && (
        <div className=\"mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700\">
          <AlertCircle className=\"h-5 w-5 flex-shrink-0\" />
          <span className=\"text-sm\">{error}</span>
        </div>
      )}

      {success && (
        <div className=\"mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-green-700\">
          <CheckCircle className=\"h-5 w-5 flex-shrink-0\" />
          <span className=\"text-sm\">{success}</span>
        </div>
      )}

      <div className=\"space-y-4\">
        <div>
          <label htmlFor=\"linkedin-url\" className=\"block text-sm font-medium text-gray-700 mb-2\">
            LinkedIn Profile URL
          </label>
          <div className=\"flex space-x-2\">
            <div className=\"flex-1\">
              <input
                type=\"url\"
                id=\"linkedin-url\"
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                placeholder=\"https://linkedin.com/in/yourname\"
                className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"
              />
            </div>
            <button
              onClick={saveLinkedInUrl}
              disabled={!linkedInUrl.trim()}
              className=\"px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors\"
            >
              Save URL
            </button>
          </div>
          <p className=\"text-xs text-gray-500 mt-1\">
            Enter your public LinkedIn profile URL
          </p>
        </div>

        <div className=\"flex items-center justify-between pt-4 border-t border-gray-200\">
          <div className=\"flex items-center space-x-2\">
            <Sync className=\"h-4 w-4 text-gray-600\" />
            <span className=\"text-sm text-gray-700\">Sync profile data from LinkedIn</span>
          </div>
          <button
            onClick={syncLinkedInData}
            disabled={syncing || !linkedInUrl.trim()}
            className=\"flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors\"
          >
            {syncing ? (
              <>
                <div className=\"animate-spin rounded-full h-4 w-4 border-b-2 border-white\"></div>
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <Sync className=\"h-4 w-4\" />
                <span>Sync LinkedIn Data</span>
              </>
            )}
          </button>
        </div>

        {profile?.linkedin_url && (
          <div className=\"pt-4 border-t border-gray-200\">
            <a
              href={profile.linkedin_url}
              target=\"_blank\"
              rel=\"noopener noreferrer\"
              className=\"flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors\"
            >
              <ExternalLink className=\"h-4 w-4\" />
              <span className=\"text-sm\">View LinkedIn Profile</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}