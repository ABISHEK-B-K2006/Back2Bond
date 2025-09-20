import React from 'react';
import { ModernLayout } from '../Layout/ModernLayout';
import { MessageList } from './MessageList';
import { MessageSquare } from 'lucide-react';

export function MessagingPage() {
  return (
    <ModernLayout activeTab="messages">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          </div>
          <p className="text-gray-600">Connect with students, alumni, and mentors</p>
        </div>

        {/* Messaging Interface */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <MessageList />
        </div>
      </div>
    </ModernLayout>
  );
}