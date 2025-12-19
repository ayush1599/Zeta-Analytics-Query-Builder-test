# Query Tagging Feature

## Overview
The query tagging feature allows users to add optional tags to their saved queries for better organization and filtering. Tags can be used to categorize queries by client name, project, or any other relevant criteria.

## Features

### 1. Adding Tags When Saving Queries
- When saving a query, users can now add optional tags
- Tags are entered in a dedicated input field
- Multiple tags can be added per query
- Tags are displayed as removable badges in the save dialog

### 2. Tag Management
- Add tags by typing and pressing Enter or clicking the "Add" button
- Remove tags by clicking the X button on each tag badge
- Tags are automatically trimmed of whitespace
- Duplicate tags are prevented

### 3. Tag Display in Query History
- Tags are displayed as blue badges next to query types in the history view
- Tags have a distinct visual style to differentiate them from query types
- Tags are shown in the expanded view of each query

### 4. Tag Filtering
- Tags are included as a filter option in the query history
- Users can filter queries by entering tag names
- Tag filtering works alongside existing filters (Campaign ID, Line Item ID, etc.)

## Database Changes

### Migration Required
To enable the tagging feature, run the following SQL migration in your Supabase database:

```sql
-- Migration: Add tags column to saved_queries table
ALTER TABLE saved_queries 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Add a comment to document the column
COMMENT ON COLUMN saved_queries.tags IS 'Array of tags for organizing and filtering saved queries';

-- Create an index on the tags column for better query performance
CREATE INDEX idx_saved_queries_tags ON saved_queries USING GIN (tags);
```

## Usage

### Saving a Query with Tags
1. Generate a query using the query builder
2. Click the "Save" button
3. In the save dialog, enter tags in the "Tags" field
4. Press Enter or click "Add" to add each tag
5. Click "Save Query" to save with the tags

### Filtering by Tags
1. Go to the Query History page
2. Select "Tags" from the filter dropdown
3. Enter a tag name in the value field
4. The list will filter to show only queries with matching tags

## Technical Implementation

### Files Modified
- `src/lib/supabase.ts` - Updated SavedQuery interface
- `src/hooks/useSavedQueries.ts` - Added tag support to save and filter functions
- `src/components/QueryOutput.tsx` - Added tag input dialog
- `src/pages/History.tsx` - Added tag display and filtering

### Key Components
- Tag input with add/remove functionality
- Tag badges with distinct styling
- Tag filtering in query history
- Database schema updates for tag storage

## Benefits
- Better query organization
- Easier query discovery
- Improved workflow for managing multiple client queries
- Enhanced search and filtering capabilities 