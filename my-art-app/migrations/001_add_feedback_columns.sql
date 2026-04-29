-- Add open_to_feedback column to posts table
ALTER TABLE posts ADD COLUMN open_to_feedback BOOLEAN DEFAULT FALSE;

-- Add type column to comments table
ALTER TABLE comments ADD COLUMN type TEXT DEFAULT 'comment';
