-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table matching user's provided schema
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_no TEXT UNIQUE,
    password TEXT NOT NULL, -- Note: In a real app, always store encrypted/hashed passwords
    
    -- Currency/Economy
    homiie_coins INTEGER DEFAULT 1000,
    homiie_cash INTEGER DEFAULT 50,
    
    -- Permissions (Manual update only)
    is_admin BOOLEAN DEFAULT false, 
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- User Profiles policies
CREATE POLICY "Public profiles are viewable by everyone." ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    sport_type TEXT NOT NULL,
    banner_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    team_a TEXT NOT NULL,
    team_b TEXT NOT NULL,
    status TEXT DEFAULT 'upcoming',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    predicted_option TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, challenge_id)
);

-- Enable Row Level Security for other tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Events are viewable by everyone." ON events FOR SELECT USING (true);
CREATE POLICY "Admins can insert events." ON events FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can update events." ON events FOR UPDATE USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true));

-- Matches policies
CREATE POLICY "Matches are viewable by everyone." ON matches FOR SELECT USING (true);
CREATE POLICY "Admins can insert matches." ON matches FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can update matches." ON matches FOR UPDATE USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true));

-- Challenges policies
CREATE POLICY "Challenges are viewable by everyone." ON challenges FOR SELECT USING (true);
CREATE POLICY "Admins can insert challenges." ON challenges FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can update challenges." ON challenges FOR UPDATE USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true));

-- Predictions policies
CREATE POLICY "Users can view their own predictions." ON predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own predictions." ON predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own predictions." ON predictions FOR UPDATE USING (auth.uid() = user_id);
