import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, User } from 'lucide-react';

export function ProfileEditPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
              <p className="text-gray-600">Update your personal information and preferences</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <Settings className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Editing</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Profile editing functionality is available through your dashboard. 
              Navigate to your role-specific dashboard to update your profile information.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full max-w-sm mx-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <User className="h-5 w-5 mr-2" />
                Go to Dashboard
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full max-w-sm mx-auto flex items-center justify-center px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}