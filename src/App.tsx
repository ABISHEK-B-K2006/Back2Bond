import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Layout/Navbar';
import { LoginForm } from './components/Auth/LoginForm';
import { SignupForm } from './components/Auth/SignupForm';
import { EnhancedAdminDashboard } from './components/Dashboard/EnhancedAdminDashboard';
import { EnhancedStudentDashboard } from './components/Dashboard/EnhancedStudentDashboard';
import { AlumniDashboard } from './components/Dashboard/AlumniDashboard';
import { ProfilePage } from './components/Common/ProfilePage';
import { ProfileEditPage } from './components/Common/ProfileEditPage';
import { EnhancedPostsManagement } from './components/Posts/EnhancedPostsManagement';
import { EnhancedAlumniSearch } from './components/Search/EnhancedAlumniSearch';
import { MessagingPage } from './components/Messaging/MessagingPage';
import { MentorshipPage } from './components/Mentorship/MentorshipPage';
import { FeedHomePage } from './components/Feed/FeedHomePage';
import { GraduationCap } from 'lucide-react';
import './styles/animations.css';

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-sky-100 to-emerald-100 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse animation-delay-4000"></div>
        <div className="absolute bottom-1/3 right-1/3 w-56 h-56 bg-gradient-to-br from-orange-400 to-red-400 rounded-full mix-blend-multiply filter blur-2xl opacity-35 animate-pulse animation-delay-1000"></div>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <div className="flex items-center space-x-3 mb-8">
            <GraduationCap className="h-16 w-16 text-blue-600" />
            <h1 className="text-6xl font-bold text-gray-900">AlumniConnect</h1>
          </div>
          
          <p className="text-xl text-gray-600 mb-12 max-w-3xl">
            Bridge the gap between students and alumni. Connect, learn, grow, and build lasting professional relationships.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <a
              href="/login"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sign In
            </a>
            <a
              href="/signup"
              className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              Join Now
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
            <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">For Students</h3>
              <p className="text-gray-600">Connect with alumni, find mentors, and get career guidance from professionals in your field.</p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">For Alumni</h3>
              <p className="text-gray-600">Give back to your alma mater by mentoring students and sharing your professional experience.</p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Community</h3>
              <p className="text-gray-600">Join a vibrant community where knowledge flows freely and professional relationships thrive.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route
          path="/"
          element={
            user && profile ? (
              <FeedHomePage />
            ) : (
              <LandingPage />
            )
          }
        />
        
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <LoginForm />}
        />
        
        <Route
          path="/signup"
          element={user ? <Navigate to="/" /> : <SignupForm />}
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <EnhancedAdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <EnhancedStudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/alumni"
          element={
            <ProtectedRoute allowedRoles={['alumni']}>
              <AlumniDashboard />
            </ProtectedRoute>
          }
        />

        {/* Posts Management */}
        <Route
          path="/posts"
          element={
            <ProtectedRoute>
              <EnhancedPostsManagement />
            </ProtectedRoute>
          }
        />

        {/* Alumni Search */}
        <Route
          path="/search"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <EnhancedAlumniSearch />
            </ProtectedRoute>
          }
        />

        {/* Messages */}
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MessagingPage />
            </ProtectedRoute>
          }
        />

        {/* Mentorship */}
        <Route
          path="/mentorship"
          element={
            <ProtectedRoute>
              <MentorshipPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <ProfileEditPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;