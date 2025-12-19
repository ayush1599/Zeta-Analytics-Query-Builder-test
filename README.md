# Zeta Analytics Query Builder

A powerful SQL query builder for analytics with save and history functionality.

## Features

### Query Generation
- **Multiple Analysis Types**: Support for performance reports, DMA analysis, frequency lag, omnichannel lift, attribution, and reach/frequency analysis
- **Flexible Filtering**: Filter by Campaign ID, Line Item ID, or Tactic ID
- **Date Range Selection**: Customizable date ranges for analysis
- **Granularity Options**: Campaign, Line Item, or Tactic level granularity
- **Advanced Configuration**: Support for conversion actions, pixel IDs, and omnichannel lift configurations

### Save & History
- **Save Queries**: Save generated queries with metadata for future reference
- **Query History**: View all saved queries in a dedicated history tab
- **Advanced Filtering**: Filter saved queries by campaign ID, line item ID, tactic ID, or query type
- **Sorting**: Sort queries by timestamp or query type
- **Expandable View**: Click on any saved query to expand and view the full SQL
- **Copy & Delete**: Copy queries to clipboard or delete them from history
- **Local Storage**: All queries are saved locally in your browser

### Deployment
- **Hue Integration**: Deploy queries directly to Hue with credentials
- **Export Options**: Download queries as text files
- **Copy to Clipboard**: Quick copy functionality for generated SQL

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- React Router (for navigation)
- Local Storage (for query persistence)

# Updated for Netlify deployment
