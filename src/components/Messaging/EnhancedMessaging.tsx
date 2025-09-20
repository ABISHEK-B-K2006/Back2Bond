import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../types/database';
import { 
  Send, 
  Users, 
  MessageSquare, 
  Handshake, 
  BookOpen, 
  UserPlus, 
  Search
} from 'lucide-react';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Message = Database['public']['Tables']['messages']['Row'] & {
  sender: Profile;
  recipient: Profile;
};

interface EnhancedMessagingProps {
  onClose?: () => void;
}

const EnhancedMessaging: React.FC<EnhancedMessagingProps> = ({ onClose }) => {
  const { profile: user } = useAuth();
  const [activeTab, setActiveTab] = useState<'messages' | 'network'>('messages');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Profile | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMessages();
      loadProfiles();
    }
  }, [user]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          recipient:profiles!messages_recipient_id_fkey(*)
        `)
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id)
        .order('full_name');

      if (error) throw error;
      setProfiles(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading profiles:', error);
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedContact || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user!.id,
          recipient_id: selectedContact.id,
          content: newMessage.trim(),
          read: false
        } as any);

      if (error) throw error;
      
      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendConnectionRequest = async (recipientId: string, message: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user!.id,
          recipient_id: recipientId,
          content: `🤝 Connection Request: ${message}`,
          read: false
        } as any);

      if (error) throw error;
      loadMessages();
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  const requestKnowledgeSession = async (expertId: string, topic: string, description: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user!.id,
          recipient_id: expertId,
          content: `📚 Knowledge Sharing Request - Topic: "${topic}" - ${description}`,
          read: false
        } as any);

      if (error) throw error;
      loadMessages();
    } catch (error) {
      console.error('Error requesting knowledge session:', error);
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (profile.skills || []).some(skill => 
      skill.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getConversations = () => {
    const conversations = new Map();
    
    messages.forEach(message => {
      const otherUser = message.sender_id === user?.id ? message.recipient : message.sender;
      const key = otherUser.id;
      
      if (!conversations.has(key) || 
          new Date(message.created_at) > new Date(conversations.get(key).created_at)) {
        conversations.set(key, {
          ...message,
          otherUser
        });
      }
    });
    
    return Array.from(conversations.values());
  };

  const getMessagesWithContact = () => {
    if (!selectedContact) return [];
    
    return messages.filter(message =>
      (message.sender_id === user?.id && message.recipient_id === selectedContact.id) ||
      (message.sender_id === selectedContact.id && message.recipient_id === user?.id)
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg h-full max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Professional Messaging</h2>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
          )}
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-4 mt-4">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              activeTab === 'messages' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Messages</span>
          </button>
          <button
            onClick={() => setActiveTab('network')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              activeTab === 'network' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Network</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'messages' ? (
          <>
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              <div className="p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search people..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Existing Conversations */}
              <div className="space-y-1">
                {getConversations().map((conversation) => (
                  <button
                    key={conversation.otherUser.id}
                    onClick={() => setSelectedContact(conversation.otherUser)}
                    className={`w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 ${
                      selectedContact?.id === conversation.otherUser.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {conversation.otherUser.full_name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.otherUser.full_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.content.length > 50 
                            ? conversation.content.substring(0, 50) + '...' 
                            : conversation.content}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* New Conversations */}
              {searchTerm && (
                <div className="border-t border-gray-200 p-3">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Start New Conversation
                  </h4>
                  <div className="space-y-1">
                    {filteredProfiles.slice(0, 5).map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => setSelectedContact(profile)}
                        className="w-full p-2 text-left hover:bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-700">
                              {profile.full_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                            <p className="text-xs text-gray-500">{profile.role} • {profile.company || profile.course}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedContact ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {selectedContact.full_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{selectedContact.full_name}</h3>
                          <p className="text-sm text-gray-500">{selectedContact.role} • {selectedContact.company || selectedContact.course}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const message = prompt('Connection request message:');
                            if (message) {
                              sendConnectionRequest(selectedContact.id, message);
                            }
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                          title="Send Connection Request"
                        >
                          <UserPlus className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            const topic = prompt('Knowledge sharing topic:');
                            if (topic) {
                              const description = prompt('Description:') || '';
                              requestKnowledgeSession(selectedContact.id, topic, description);
                            }
                          }}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                          title="Request Knowledge Sharing"
                        >
                          <BookOpen className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {getMessagesWithContact().map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_id === user?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          {(message.content.startsWith('🤝') || message.content.startsWith('📚')) && (
                            <div className="flex items-center space-x-1 mb-1">
                              {message.content.startsWith('🤝') && <Handshake className="h-3 w-3" />}
                              {message.content.startsWith('📚') && <BookOpen className="h-3 w-3" />}
                              <span className="text-xs opacity-75">
                                {message.content.startsWith('🤝') ? 'Connection Request' : 'Knowledge Request'}
                              </span>
                            </div>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-75 mt-1">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={sendMessage}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-500">Choose a contact to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Network</h3>
            
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search professionals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Network List */}
            <div className="space-y-4">
              {filteredProfiles.map((profile) => (
                <div key={profile.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-lg font-medium text-gray-700">
                          {profile.full_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{profile.full_name}</h4>
                        <p className="text-sm text-gray-500">{profile.role} • {profile.company || profile.course}</p>
                        {profile.bio && (
                          <p className="text-sm text-gray-600 mt-1 max-w-md">
                            {profile.bio.length > 100 ? profile.bio.substring(0, 100) + '...' : profile.bio}
                          </p>
                        )}
                        {profile.skills && profile.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {profile.skills.slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                            {profile.skills.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{profile.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedContact(profile)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Message
                      </button>
                      <button
                        onClick={() => {
                          const message = prompt('Connection request message:');
                          if (message) {
                            sendConnectionRequest(profile.id, message);
                          }
                        }}
                        className="px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredProfiles.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No professionals found</h3>
                  <p className="text-gray-500">Try adjusting your search terms</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMessaging;