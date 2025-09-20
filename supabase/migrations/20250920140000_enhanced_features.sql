-- Add missing tables for enhanced features

-- Connection requests table
CREATE TABLE IF NOT EXISTS connection_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sender_id, recipient_id)
);

-- Connections table (accepted connections)
CREATE TABLE IF NOT EXISTS connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    connected_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'accepted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, connected_user_id)
);

-- Enhanced mentorship availability table
CREATE TABLE IF NOT EXISTS mentorship_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alumni_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    available_days TEXT[] NOT NULL DEFAULT '{}', -- ['Monday', 'Tuesday', etc.]
    available_hours JSONB NOT NULL DEFAULT '{\"start\": \"09:00\", \"end\": \"17:00\"}',
    session_duration INTEGER DEFAULT 60, -- minutes
    max_mentees_per_month INTEGER DEFAULT 5,
    specialization_areas TEXT[] DEFAULT '{}',
    preferred_communication VARCHAR(50) DEFAULT 'video_call',
    timezone VARCHAR(100) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(alumni_id)
);

-- Add RLS policies
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_availability ENABLE ROW LEVEL SECURITY;

-- Connection requests policies
CREATE POLICY \"Users can view their own connection requests\" ON connection_requests FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
);

CREATE POLICY \"Users can create connection requests\" ON connection_requests FOR INSERT WITH CHECK (
    auth.uid() = sender_id
);

CREATE POLICY \"Users can update connection requests they received\" ON connection_requests FOR UPDATE USING (
    auth.uid() = recipient_id
);

-- Connections policies
CREATE POLICY \"Users can view their connections\" ON connections FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = connected_user_id
);

CREATE POLICY \"System can create connections\" ON connections FOR INSERT WITH CHECK (true);

-- Mentorship availability policies
CREATE POLICY \"Everyone can view active mentorship availability\" ON mentorship_availability FOR SELECT USING (is_active = true);

CREATE POLICY \"Alumni can manage their availability\" ON mentorship_availability FOR ALL USING (
    auth.uid() = alumni_id AND 
    EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'alumni')
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_connection_requests_sender ON connection_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_recipient ON connection_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_connections_user ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_connected_user ON connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_availability_alumni ON mentorship_availability(alumni_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_availability_active ON mentorship_availability(is_active);