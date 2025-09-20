-- Enhanced AlumniConnect Database Schema for Professional Features

-- Add connection requests table for professional networking
CREATE TABLE IF NOT EXISTS connection_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sender_id, recipient_id)
);

-- Add student certificates table
CREATE TABLE IF NOT EXISTS student_certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    credential_id VARCHAR(255),
    credential_url TEXT,
    description TEXT,
    image_url TEXT,
    skills TEXT[], -- Skills gained from this certificate
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add mentorship availability table for alumni
CREATE TABLE IF NOT EXISTS mentorship_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alumni_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT true,
    max_mentees INTEGER DEFAULT 5,
    preferred_skills TEXT[],
    availability_hours JSONB, -- Store weekly schedule
    session_duration INTEGER DEFAULT 60, -- minutes
    preferred_communication VARCHAR(50) DEFAULT 'video_call', -- video_call, phone, chat
    timezone VARCHAR(100),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(alumni_id)
);

-- Enhanced posts table with media support
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_urls TEXT[];
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_types TEXT[]; -- image, video, document
ALTER TABLE posts ADD COLUMN IF NOT EXISTS target_skills TEXT[]; -- For skill-based community posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_category VARCHAR(50) DEFAULT 'general'; -- general, knowledge_share, job_posting, event

-- Add post reactions table (beyond simple likes)
CREATE TABLE IF NOT EXISTS post_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'celebrate', 'support', 'insightful', 'funny')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Add connections table (accepted connection requests)
CREATE TABLE IF NOT EXISTS connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id),
    CHECK (user1_id != user2_id)
);

-- Add knowledge sharing sessions table
CREATE TABLE IF NOT EXISTS knowledge_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    skills_covered TEXT[],
    session_type VARCHAR(50) DEFAULT 'webinar', -- webinar, workshop, qa_session, presentation
    scheduled_at TIMESTAMP WITH TIME ZONE,
    duration INTEGER DEFAULT 60, -- minutes
    max_participants INTEGER DEFAULT 50,
    meeting_url TEXT,
    is_recording_allowed BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add session participants table
CREATE TABLE IF NOT EXISTS session_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES knowledge_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

-- Enhanced profiles table with professional fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headline VARCHAR(255); -- Professional headline
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS open_to_work BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS open_to_mentor BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'connections_only', 'private'));

-- Add RLS policies
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

-- Connection requests policies
CREATE POLICY "Users can view connection requests involving them" ON connection_requests
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
    
CREATE POLICY "Users can send connection requests" ON connection_requests
    FOR INSERT WITH CHECK (auth.uid() = sender_id);
    
CREATE POLICY "Recipients can update connection requests" ON connection_requests
    FOR UPDATE USING (auth.uid() = recipient_id);

-- Student certificates policies
CREATE POLICY "Anyone can view certificates" ON student_certificates FOR SELECT USING (true);
CREATE POLICY "Students can manage their certificates" ON student_certificates
    FOR ALL USING (auth.uid() = student_id);

-- Mentorship availability policies
CREATE POLICY "Anyone can view mentorship availability" ON mentorship_availability FOR SELECT USING (true);
CREATE POLICY "Alumni can manage their availability" ON mentorship_availability
    FOR ALL USING (
        auth.uid() = alumni_id AND 
        EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'alumni')
    );

-- Post reactions policies
CREATE POLICY "Users can view all reactions" ON post_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their reactions" ON post_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their reactions" ON post_reactions FOR DELETE USING (auth.uid() = user_id);

-- Connections policies
CREATE POLICY "Users can view their connections" ON connections
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
    
CREATE POLICY "System can create connections" ON connections FOR INSERT WITH CHECK (true);

-- Knowledge sessions policies
CREATE POLICY "Users can view public sessions" ON knowledge_sessions FOR SELECT USING (true);
CREATE POLICY "Users can create sessions" ON knowledge_sessions FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update their sessions" ON knowledge_sessions FOR UPDATE USING (auth.uid() = host_id);

-- Session participants policies
CREATE POLICY "Users can view session participants" ON session_participants FOR SELECT USING (true);
CREATE POLICY "Users can join sessions" ON session_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS connection_requests_sender_idx ON connection_requests(sender_id);
CREATE INDEX IF NOT EXISTS connection_requests_recipient_idx ON connection_requests(recipient_id);
CREATE INDEX IF NOT EXISTS connection_requests_status_idx ON connection_requests(status);

CREATE INDEX IF NOT EXISTS student_certificates_student_idx ON student_certificates(student_id);
CREATE INDEX IF NOT EXISTS student_certificates_skills_idx ON student_certificates USING GIN(skills);

CREATE INDEX IF NOT EXISTS mentorship_availability_alumni_idx ON mentorship_availability(alumni_id);
CREATE INDEX IF NOT EXISTS mentorship_availability_skills_idx ON mentorship_availability USING GIN(preferred_skills);

CREATE INDEX IF NOT EXISTS post_reactions_post_idx ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS post_reactions_user_idx ON post_reactions(user_id);

CREATE INDEX IF NOT EXISTS connections_user1_idx ON connections(user1_id);
CREATE INDEX IF NOT EXISTS connections_user2_idx ON connections(user2_id);

CREATE INDEX IF NOT EXISTS knowledge_sessions_host_idx ON knowledge_sessions(host_id);
CREATE INDEX IF NOT EXISTS knowledge_sessions_scheduled_idx ON knowledge_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS knowledge_sessions_skills_idx ON knowledge_sessions USING GIN(skills_covered);

CREATE INDEX IF NOT EXISTS posts_target_skills_idx ON posts USING GIN(target_skills);
CREATE INDEX IF NOT EXISTS posts_category_idx ON posts(post_category);

-- Update posts table indexes
CREATE INDEX IF NOT EXISTS posts_media_idx ON posts USING GIN(media_urls);
CREATE INDEX IF NOT EXISTS posts_type_category_idx ON posts(type, post_category);