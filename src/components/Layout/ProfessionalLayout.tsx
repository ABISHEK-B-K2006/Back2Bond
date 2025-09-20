import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  Users, 
  MessageSquare, 
  Bell, 
  Search,
  Briefcase,
  BookOpen,
  Award,
  Settings,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface ProfessionalLayoutProps {
  children: React.ReactNode;
}

export function ProfessionalLayout({ children }: ProfessionalLayoutProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigation = [
    {
      name: 'Home',
      href: profile?.role === 'admin' ? '/admin' : profile?.role === 'student' ? '/student' : '/alumni',
      icon: Home,
      current: location.pathname === (profile?.role === 'admin' ? '/admin' : profile?.role === 'student' ? '/student' : '/alumni')
    },
    {
      name: 'My Network',
      href: '/network',
      icon: Users,
      current: location.pathname === '/network'
    },
    {
      name: 'Messaging',
      href: '/messages',
      icon: MessageSquare,
      current: location.pathname === '/messages'
    },
    {
      name: 'Jobs',
      href: '/jobs',
      icon: Briefcase,
      current: location.pathname === '/jobs'
    },
    {
      name: 'Learning',
      href: '/learning',
      icon: BookOpen,
      current: location.pathname === '/learning'
    }
  ];

  if (profile?.role === 'student') {
    navigation.push({
      name: 'Certificates',
      href: '/certificates',
      icon: Award,
      current: location.pathname === '/certificates'
    });
  }

  if (profile?.role === 'alumni') {
    navigation.push({
      name: 'Mentorship',
      href: '/mentorship-availability',
      icon: Users,
      current: location.pathname === '/mentorship-availability'
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Search */}
            <div className="flex items-center flex-1">
              <Link to="/" className="flex items-center space-x-2 mr-8">
                <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 hidden sm:block">AlumniConnect</span>
              </Link>
              
              {/* Search Bar */}
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search people, posts, and more..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Navigation and Profile */}
            <div className="flex items-center space-x-4">
              {/* Main Navigation */}
              <nav className="hidden md:flex space-x-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex flex-col items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                      item.current
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mb-1" />
                    <span className="hidden lg:block">{item.name}</span>
                  </Link>
                ))}
              </nav>

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{profile?.full_name}</div>
                    <div className="text-xs text-gray-500 capitalize">{profile?.role}</div>
                  </div>
                </div>
              </div>

              {/* Settings and Logout */}
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md">
                  <Settings className="h-5 w-5" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Profile Summary */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Profile Header */}
              <div className="h-16 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              <div className="px-4 pb-4 -mt-8">
                <div className="h-16 w-16 rounded-full bg-white border-4 border-white mx-auto mb-3">
                  <div className="h-full w-full rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-700">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900">{profile?.full_name}</h3>
                  <p className="text-sm text-gray-600">{profile?.bio || `${profile?.role} at AlumniConnect`}</p>
                  <div className="mt-3 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Profile views</span>
                      <span className="text-blue-600 font-medium">127</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Connections</span>
                      <span className="text-blue-600 font-medium">45</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <Link
                  to="/profile"
                  className="block text-sm text-blue-600 hover:text-blue-700"
                >
                  View Profile
                </Link>
                <Link
                  to="/settings"
                  className="block text-sm text-blue-600 hover:text-blue-700"
                >
                  Account Settings
                </Link>
                {profile?.role === 'student' && (
                  <Link
                    to="/certificates"
                    className="block text-sm text-blue-600 hover:text-blue-700"
                  >
                    Manage Certificates
                  </Link>
                )}
                {profile?.role === 'alumni' && (
                  <Link
                    to="/mentorship-availability"
                    className="block text-sm text-blue-600 hover:text-blue-700"
                  >
                    Mentorship Settings
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-6">
            {children}
          </div>

          {/* Right Sidebar - Activity & Suggestions */}
          <div className="lg:col-span-3">
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <MessageSquare className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600">
                      New message from <span className="font-medium">Sarah Johnson</span>
                    </p>
                    <p className="text-xs text-gray-400">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Users className="h-3 w-3 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Mike Chen</span> accepted your connection
                    </p>
                    <p className="text-xs text-gray-400">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
                    <BookOpen className="h-3 w-3 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600">
                      New post in <span className="font-medium">React Development</span>
                    </p>
                    <p className="text-xs text-gray-400">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* People You May Know */}
            <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">People You May Know</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gray-300"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Alex Rodriguez</p>
                      <p className="text-xs text-gray-500">Software Engineer</p>
                    </div>
                  </div>
                  <button className="text-xs text-blue-600 hover:text-blue-700">Connect</button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gray-300"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Emma Davis</p>
                      <p className="text-xs text-gray-500">Product Manager</p>
                    </div>
                  </div>
                  <button className="text-xs text-blue-600 hover:text-blue-700">Connect</button>
                </div>
              </div>
            </div>

            {/* Trending Skills */}
            <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Trending Skills</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">React</span>
                  <span className="text-xs text-green-600">+12%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Machine Learning</span>
                  <span className="text-xs text-green-600">+8%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Data Science</span>
                  <span className="text-xs text-green-600">+5%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 gap-1">
          {navigation.slice(0, 5).map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center py-2 px-1 text-xs ${
                item.current
                  ? 'text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="truncate">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}