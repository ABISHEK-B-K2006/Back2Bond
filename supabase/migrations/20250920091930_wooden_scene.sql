/*
  # AlumniConnect Database Schema

  1. New Tables
    - `profiles` - User profiles with role-based information
      - `id` (uuid, primary key, linked to auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (enum: admin, student, alumni)
      - `avatar_url` (text, optional)
      - `bio` (text, optional)
      - `skills` (text array, for alumni)
      - `graduation_year` (integer, for alumni)
      - `current_position` (text, for alumni)
      - `company` (text, for alumni)
      - `course` (text, for students)
      - `year` (integer, for students)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `posts` - All posts in the system
      - `id` (uuid, primary key)
      - `author_id` (uuid, foreign key to profiles)
      - `title` (text)
      - `content` (text)
      - `type` (enum: common, student_only, alumni_only, announcement)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `messages` - Direct messaging between users
      - `id` (uuid, primary key)
      - `sender_id` (uuid, foreign key to profiles)
      - `recipient_id` (uuid, foreign key to profiles)
      - `content` (text)
      - `read` (boolean, default false)
      - `created_at` (timestamp)

    - `mentorship_requests` - Mentorship workflow
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to profiles)
      - `alumni_id` (uuid, foreign key to profiles)
      - `message` (text)
      - `status` (enum: pending, accepted, rejected, completed)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `notifications` - System notifications
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `type` (enum: message, mentorship, announcement, post)
      - `title` (text)
      - `content` (text)
      - `read` (boolean, default false)
      - `related_id` (uuid, optional - references related record)
      - `created_at` (timestamp)

    - `follows` - Alumni following system
      - `id` (uuid, primary key)
      - `follower_id` (uuid, foreign key to profiles)
      - `following_id` (uuid, foreign key to profiles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure messaging between authorized users
    - Admin-only access to analytics and user management

  3. Indexes
    - Add performance indexes for frequently queried columns
    - Optimize search queries for alumni discovery
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'student', 'alumni');
CREATE TYPE post_type AS ENUM ('common', 'student_only', 'alumni_only', 'announcement');
CREATE TYPE mentorship_status AS ENUM ('pending', 'accepted', 'rejected', 'completed');
CREATE TYPE notification_type AS ENUM ('message', 'mentorship', 'announcement', 'post');

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url text,
  bio text,
  skills text[],
  graduation_year integer,
  current_position text,
  company text,
  course text,
  year integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  type post_type NOT NULL DEFAULT 'common',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Mentorship requests table
CREATE TABLE IF NOT EXISTS mentorship_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  alumni_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  status mentorship_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  related_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Posts policies
CREATE POLICY "Posts are viewable based on type and user role"
  ON posts FOR SELECT
  USING (
    type = 'common' OR
    (type = 'student_only' AND EXISTS (SELECT 1 FROM profiles WHERE id::text = auth.uid()::text AND role IN ('student', 'admin'))) OR
    (type = 'alumni_only' AND EXISTS (SELECT 1 FROM profiles WHERE id::text = auth.uid()::text AND role IN ('alumni', 'admin'))) OR
    (type = 'announcement')
  );

CREATE POLICY "Users can create posts based on their role"
  ON posts FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id::text = auth.uid()::text AND id = author_id AND
      ((role = 'admin') OR
       (role = 'student' AND type IN ('common', 'student_only')) OR
       (role = 'alumni' AND type IN ('common', 'alumni_only'))))
  );

CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (author_id::text = auth.uid()::text);

CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  USING (author_id::text = auth.uid()::text);

-- Messages policies
CREATE POLICY "Users can view messages they sent or received"
  ON messages FOR SELECT
  USING (sender_id::text = auth.uid()::text OR recipient_id::text = auth.uid()::text);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id::text = auth.uid()::text);

CREATE POLICY "Users can update messages they received (mark as read)"
  ON messages FOR UPDATE
  USING (recipient_id::text = auth.uid()::text);

-- Mentorship requests policies
CREATE POLICY "Users can view mentorship requests they're involved in"
  ON mentorship_requests FOR SELECT
  USING (student_id::text = auth.uid()::text OR alumni_id::text = auth.uid()::text);

CREATE POLICY "Students can create mentorship requests"
  ON mentorship_requests FOR INSERT
  WITH CHECK (
    student_id::text = auth.uid()::text AND
    EXISTS (SELECT 1 FROM profiles WHERE id::text = auth.uid()::text AND role = 'student')
  );

CREATE POLICY "Alumni can update mentorship requests status"
  ON mentorship_requests FOR UPDATE
  USING (alumni_id::text = auth.uid()::text);

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id::text = auth.uid()::text);

-- Follows policies
CREATE POLICY "Follow relationships are viewable by everyone"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (follower_id::text = auth.uid()::text);

CREATE POLICY "Users can unfollow others"
  ON follows FOR DELETE
  USING (follower_id::text = auth.uid()::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_graduation_year_idx ON profiles(graduation_year);
CREATE INDEX IF NOT EXISTS profiles_skills_idx ON profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS posts_type_idx ON posts(type);
CREATE INDEX IF NOT EXISTS posts_author_created_idx ON posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_recipient_idx ON messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS messages_created_idx ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS mentorship_requests_status_idx ON mentorship_requests(status);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS follows_follower_idx ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON follows(following_id);

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentorship_requests_updated_at BEFORE UPDATE ON mentorship_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();