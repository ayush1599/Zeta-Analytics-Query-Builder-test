-- Migration: Add tags column to saved_queries table
-- This migration adds a tags column to store query tags as an array of strings

ALTER TABLE saved_queries 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Add a comment to document the column
COMMENT ON COLUMN saved_queries.tags IS 'Array of tags for organizing and filtering saved queries';

-- Create an index on the tags column for better query performance
CREATE INDEX idx_saved_queries_tags ON saved_queries USING GIN (tags); 