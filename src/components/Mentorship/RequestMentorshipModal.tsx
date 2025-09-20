import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { X, Send, Briefcase, MapPin, Calendar } from 'lucide-react';

interface Alumni {
  id: string;
  full_name: string;
  avatar_url: string | null;
  company: string | null;
  current_position: string | null;
  bio: string | null;
  skills: string[] | null;
  graduation_year: number | null;
}

interface RequestMentorshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  alumni: Alumni;
  onRequestSent: () => void;
}

export function RequestMentorshipModal({ isOpen, onClose, alumni, onRequestSent }: RequestMentorshipModalProps) {
  const { profile } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !message.trim()) return;

    setSending(true);
    setError('');

    try {
      // Check if a request already exists
      const { data: existingRequest } = await supabase
        .from('mentorship_requests')
        .select('id, status')
        .eq('student_id', profile.id)
        .eq('alumni_id', alumni.id)
        .single();

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          setError('You already have a pending request with this alumni');
          return;
        }
        if (existingRequest.status === 'accepted') {
          setError('You already have an active mentorship with this alumni');
          return;
        }
      }

      // Create new mentorship request
      const { error: insertError } = await supabase
        .from('mentorship_requests')
        .insert({
          student_id: profile.id,
          alumni_id: alumni.id,
          message: message.trim()
        });

      if (insertError) throw insertError;

      // Create notification for alumni
      await supabase
        .from('notifications')
        .insert({
          user_id: alumni.id,
          type: 'mentorship',
          title: 'New Mentorship Request',
          content: `${profile.full_name} has requested you as a mentor`,
          related_id: alumni.id
        });

      onRequestSent();
      handleClose();
    } catch (error: any) {
      console.error('Error sending mentorship request:', error);
      setError(error.message || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Request Mentorship</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Alumni Information */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-4">
              <img
                src={alumni.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(alumni.full_name)}&background=6366f1&color=ffffff`}
                alt={alumni.full_name}
                className="w-16 h-16 rounded-full"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{alumni.full_name}</h3>
                
                {alumni.current_position && (
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Briefcase className="h-4 w-4 mr-1" />
                    <span>{alumni.current_position}</span>
                    {alumni.company && <span className="ml-1">at {alumni.company}</span>}
                  </div>
                )}

                {alumni.graduation_year && (
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Graduated in {alumni.graduation_year}</span>
                  </div>
                )}

                {alumni.bio && (
                  <p className="text-sm text-gray-700 mt-2 italic">"{alumni.bio}"</p>
                )}

                {alumni.skills && alumni.skills.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {alumni.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Why do you want {alumni.full_name} as your mentor? *
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Explain your goals, what you hope to learn, and why you think this alumni would be a great mentor for you. Be specific about your interests and career aspirations..."
                required
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 mt-1">
                {message.length}/1000 characters
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>{sending ? 'Sending...' : 'Send Request'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}