-- Add post likes and comments tables
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for post_likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all post likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own likes" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for post_comments
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on visible posts" ON post_comments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM posts p 
        JOIN profiles pr ON p.author_id = pr.id
        WHERE p.id = post_comments.post_id
        AND (
            p.type = 'common' OR 
            p.type = 'announcement' OR
            (p.type = 'student_only' AND EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('student', 'admin'))) OR
            (p.type = 'alumni_only' AND EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('alumni', 'admin')))
        )
    )
);

CREATE POLICY "Users can add comments to visible posts" ON post_comments FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM posts p 
        WHERE p.id = post_comments.post_id
        AND (
            p.type = 'common' OR 
            p.type = 'announcement' OR
            (p.type = 'student_only' AND EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('student', 'admin'))) OR
            (p.type = 'alumni_only' AND EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('alumni', 'admin')))
        )
    )
);

CREATE POLICY "Users can update their own comments" ON post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON post_comments FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS post_likes_post_id_idx ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS post_likes_user_id_idx ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS post_comments_post_id_idx ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS post_comments_user_id_idx ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS post_comments_created_at_idx ON post_comments(created_at);

-- Add profiles updates for LinkedIn integration
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;