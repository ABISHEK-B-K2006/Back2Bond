import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Clock, 
  Calendar, 
  Users, 
  Globe, 
  Edit, 
  Save, 
  X,
  Plus,
  Minus
} from 'lucide-react';

interface MentorshipAvailability {
  id: string;
  alumni_id: string;
  available_days: string[];
  available_hours: string;
  timezone: string;
  max_mentees: number;
  current_mentees: number;
  specialization: string[] | null;
  session_duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const TIMEZONES = [
  'UTC', 'EST', 'CST', 'MST', 'PST', 'GMT', 'CET', 'IST', 'JST', 'AEST'
];

export function MentorshipAvailability() {
  const { profile } = useAuth();
  const [availability, setAvailability] = useState<MentorshipAvailability | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    available_days: [] as string[],
    available_hours: '',
    timezone: 'UTC',
    max_mentees: 5,
    specialization: [] as string[],
    session_duration: 60,
    is_active: true
  });
  const [specializationInput, setSpecializationInput] = useState('');

  useEffect(() => {
    if (profile?.role === 'alumni') {
      fetchAvailability();
    }
  }, [profile]);

  const fetchAvailability = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('mentorship_availability')
        .select('*')
        .eq('alumni_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setAvailability(data);
        setFormData({
          available_days: data.available_days,
          available_hours: data.available_hours,
          timezone: data.timezone,
          max_mentees: data.max_mentees,
          specialization: data.specialization || [],
          session_duration: data.session_duration,
          is_active: data.is_active
        });
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const data = {
        alumni_id: profile.id,
        available_days: formData.available_days,
        available_hours: formData.available_hours,
        timezone: formData.timezone,
        max_mentees: formData.max_mentees,
        current_mentees: availability?.current_mentees || 0,
        specialization: formData.specialization.length > 0 ? formData.specialization : null,
        session_duration: formData.session_duration,
        is_active: formData.is_active
      };

      if (availability) {
        const { error } = await supabase
          .from('mentorship_availability')
          .update(data as any)
          .eq('id', availability.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('mentorship_availability')
          .insert(data as any);
        if (error) throw error;
      }

      await fetchAvailability();
      setEditing(false);
    } catch (error) {
      console.error('Error saving availability:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter(d => d !== day)
        : [...prev.available_days, day]
    }));
  };

  const addSpecialization = () => {
    if (specializationInput.trim() && !formData.specialization.includes(specializationInput.trim())) {
      setFormData(prev => ({
        ...prev,
        specialization: [...prev.specialization, specializationInput.trim()]
      }));
      setSpecializationInput('');
    }
  };

  const removeSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specialization: prev.specialization.filter(s => s !== spec)
    }));
  };

  if (profile?.role !== 'alumni') {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Alumni Only</h3>
        <p className="mt-1 text-sm text-gray-500">
          This feature is only available for alumni members.
        </p>
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mentorship Availability</h2>
          <p className="text-gray-600">Set your availability for mentoring students</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            {availability ? 'Edit Availability' : 'Set Availability'}
          </button>
        )}
      </div>

      {editing ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Active Status */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Mentorship Status</h3>
                <p className="text-sm text-gray-600">Enable or disable your mentorship availability</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Available Days */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Available Days</h3>
              <div className="grid grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`p-3 text-sm rounded-lg border transition-colors ${
                      formData.available_days.includes(day)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Available Hours & Timezone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Hours
                </label>
                <input
                  type="text"
                  value={formData.available_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, available_hours: e.target.value }))}
                  placeholder="e.g., 9:00 AM - 6:00 PM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Max Mentees & Session Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Mentees
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, max_mentees: Math.max(1, prev.max_mentees - 1) }))}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-lg font-medium text-gray-900 min-w-[3rem] text-center">
                    {formData.max_mentees}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, max_mentees: prev.max_mentees + 1 }))}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Duration (minutes)
                </label>
                <select
                  value={formData.session_duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, session_duration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Areas of Expertise
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.specialization.map((spec) => (
                  <span
                    key={spec}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {spec}
                    <button
                      type="button"
                      onClick={() => removeSpecialization(spec)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={specializationInput}
                  onChange={(e) => setSpecializationInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                  placeholder="Add area of expertise..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addSpecialization}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || formData.available_days.length === 0}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Availability
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : availability ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${availability.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Users className={`h-5 w-5 ${availability.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {availability.is_active ? 'Active Mentorship' : 'Inactive'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {availability.current_mentees} / {availability.max_mentees} mentees
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                availability.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {availability.is_active ? 'Available' : 'Unavailable'}
              </span>
            </div>

            {/* Schedule Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Available Days</p>
                    <p className="text-sm text-gray-600">{availability.available_days.join(', ')}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Hours & Duration</p>
                    <p className="text-sm text-gray-600">
                      {availability.available_hours} ({availability.session_duration} min sessions)
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Timezone</p>
                    <p className="text-sm text-gray-600">{availability.timezone}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Mentee Capacity</p>
                    <p className="text-sm text-gray-600">
                      {availability.current_mentees} current / {availability.max_mentees} maximum
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Specialization */}
            {availability.specialization && availability.specialization.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Areas of Expertise</p>
                <div className="flex flex-wrap gap-2">
                  {availability.specialization.map((spec, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No availability set</h3>
          <p className="mt-1 text-sm text-gray-500">
            Set your mentorship availability to help students connect with you.
          </p>
        </div>
      )}
    </div>
  );
}