export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'student' | 'alumni'
          avatar_url: string | null
          bio: string | null
          skills: string[] | null
          graduation_year: number | null
          current_position: string | null
          company: string | null
          course: string | null
          year: number | null
          linkedin_url: string | null
          github_url: string | null
          website_url: string | null
          phone: string | null
          location: string | null
          headline: string | null
          summary: string | null
          education: string | null
          experience: string | null
          languages: string[] | null
          is_open_to_mentor: boolean
          is_seeking_opportunities: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role?: 'admin' | 'student' | 'alumni'
          avatar_url?: string | null
          bio?: string | null
          skills?: string[] | null
          graduation_year?: number | null
          current_position?: string | null
          company?: string | null
          course?: string | null
          year?: number | null
          linkedin_url?: string | null
          github_url?: string | null
          website_url?: string | null
          phone?: string | null
          location?: string | null
          headline?: string | null
          summary?: string | null
          education?: string | null
          experience?: string | null
          languages?: string[] | null
          is_open_to_mentor?: boolean
          is_seeking_opportunities?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'student' | 'alumni'
          avatar_url?: string | null
          bio?: string | null
          skills?: string[] | null
          graduation_year?: number | null
          current_position?: string | null
          company?: string | null
          course?: string | null
          year?: number | null
          linkedin_url?: string | null
          github_url?: string | null
          website_url?: string | null
          phone?: string | null
          location?: string | null
          headline?: string | null
          summary?: string | null
          education?: string | null
          experience?: string | null
          languages?: string[] | null
          is_open_to_mentor?: boolean
          is_seeking_opportunities?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          author_id: string
          title: string
          content: string
          type: 'common' | 'student_only' | 'alumni_only' | 'announcement' | 'community'
          media_urls: string[] | null
          media_type: 'text' | 'image' | 'video' | 'mixed' | null
          target_skills: string[] | null
          visibility: 'public' | 'connections' | 'private'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          content: string
          type?: 'common' | 'student_only' | 'alumni_only' | 'announcement' | 'community'
          media_urls?: string[] | null
          media_type?: 'text' | 'image' | 'video' | 'mixed' | null
          target_skills?: string[] | null
          visibility?: 'public' | 'connections' | 'private'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          content?: string
          type?: 'common' | 'student_only' | 'alumni_only' | 'announcement' | 'community'
          media_urls?: string[] | null
          media_type?: 'text' | 'image' | 'video' | 'mixed' | null
          target_skills?: string[] | null
          visibility?: 'public' | 'connections' | 'private'
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          content: string
          message_type: 'message' | 'connection_request' | 'knowledge_share'
          connection_request_status: 'pending' | 'accepted' | 'rejected' | null
          knowledge_session_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          content: string
          message_type?: 'message' | 'connection_request' | 'knowledge_share'
          connection_request_status?: 'pending' | 'accepted' | 'rejected' | null
          knowledge_session_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          content?: string
          message_type?: 'message' | 'connection_request' | 'knowledge_share'
          connection_request_status?: 'pending' | 'accepted' | 'rejected' | null
          knowledge_session_id?: string | null
          read?: boolean
          created_at?: string
        }
      }
      mentorship_requests: {
        Row: {
          id: string
          student_id: string
          alumni_id: string
          message: string
          status: 'pending' | 'accepted' | 'rejected' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          alumni_id: string
          message: string
          status?: 'pending' | 'accepted' | 'rejected' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          alumni_id?: string
          message?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'message' | 'mentorship' | 'announcement' | 'post'
          title: string
          content: string
          read: boolean
          related_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'message' | 'mentorship' | 'announcement' | 'post'
          title: string
          content: string
          read?: boolean
          related_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'message' | 'mentorship' | 'announcement' | 'post'
          title?: string
          content?: string
          read?: boolean
          related_id?: string | null
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      connection_requests: {
        Row: {
          id: string
          requester_id: string
          recipient_id: string
          message: string | null
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          recipient_id: string
          message?: string | null
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          recipient_id?: string
          message?: string | null
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          created_at?: string
        }
      }
      student_certificates: {
        Row: {
          id: string
          student_id: string
          title: string
          issuer: string
          issue_date: string
          certificate_url: string | null
          description: string | null
          skills: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          title: string
          issuer: string
          issue_date: string
          certificate_url?: string | null
          description?: string | null
          skills?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          title?: string
          issuer?: string
          issue_date?: string
          certificate_url?: string | null
          description?: string | null
          skills?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      mentorship_availability: {
        Row: {
          id: string
          alumni_id: string
          available_days: string[]
          available_hours: string
          timezone: string
          max_mentees: number
          current_mentees: number
          specialization: string[] | null
          session_duration: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          alumni_id: string
          available_days: string[]
          available_hours: string
          timezone: string
          max_mentees?: number
          current_mentees?: number
          specialization?: string[] | null
          session_duration?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          alumni_id?: string
          available_days?: string[]
          available_hours?: string
          timezone?: string
          max_mentees?: number
          current_mentees?: number
          specialization?: string[] | null
          session_duration?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      knowledge_sessions: {
        Row: {
          id: string
          requester_id: string
          expert_id: string
          topic: string
          description: string
          status: 'pending' | 'accepted' | 'completed' | 'cancelled'
          scheduled_at: string | null
          duration_minutes: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          expert_id: string
          topic: string
          description: string
          status?: 'pending' | 'accepted' | 'completed' | 'cancelled'
          scheduled_at?: string | null
          duration_minutes?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          expert_id?: string
          topic?: string
          description?: string
          status?: 'pending' | 'accepted' | 'completed' | 'cancelled'
          scheduled_at?: string | null
          duration_minutes?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      post_reactions: {
        Row: {
          id: string
          post_id: string
          user_id: string
          reaction_type: 'like' | 'love' | 'celebrate' | 'support' | 'insightful'
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          reaction_type: 'like' | 'love' | 'celebrate' | 'support' | 'insightful'
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          reaction_type?: 'like' | 'love' | 'celebrate' | 'support' | 'insightful'
          created_at?: string
        }
      }
    }
  }
}