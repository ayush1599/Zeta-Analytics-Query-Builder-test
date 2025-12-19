import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, User, Send, Copy, Download, Loader2, Lightbulb, Settings, Code, FileText, Rocket, Check, ChevronsUpDown, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from "@/hooks/use-toast";
import { sqlTemplates } from '@/data/knowledgeBase';

// Types
interface QueryIntent {
  analysisType: string;
  metrics: string[];
  dimensions: string[];
  dateRange: string;
  filters: string[];
  granularity?: string[];
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: QueryIntent;
  sqlQuery?: string;
  reportColumns?: string[];
  templates?: any[];
}

interface SQLTemplate {
  id: string;
  name: string;
  purpose: string;
  template: string;
  keywords: string[];
  metadata: {
    metrics: string[];
    dimensions: string[];
    requiredParams: string[];
    optionalParams: string[];
  };
}

type GranularityLevel = 'campaign' | 'line_item' | 'tactic' | 'campaign_line_item' | 'campaign_tactic' | 'line_item_tactic' | 'all';

type UserMode = 'analyst' | 'account_manager';

const granularityOptions = [
  { value: "campaign", label: "Campaign Only" },
  { value: "line_item", label: "Line Item Only" },
  { value: "tactic", label: "Tactic Only" },
  { value: "campaign_line_item", label: "Campaign + Line Item" },
  { value: "campaign_tactic", label: "Campaign + Tactic" },
  { value: "line_item_tactic", label: "Line Item + Tactic" },
  { value: "all", label: "All Levels" },
];

interface ConversationalAIProps {
  userMode?: UserMode;
  setUserMode?: (mode: UserMode) => void;
}

export const ConversationalAI: React.FC<ConversationalAIProps> = ({ 
  userMode: externalUserMode, 
  setUserMode: externalSetUserMode 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [granularity, setGranularity] = useState<GranularityLevel>('campaign');
  const [internalUserMode, setInternalUserMode] = useState<UserMode>('analyst');
  
  // Use external props if provided, otherwise use internal state
  const userMode = externalUserMode ?? internalUserMode;
  const setUserMode = externalSetUserMode ?? setInternalUserMode;
  const [isDeploying, setIsDeploying] = useState(false);
  const [username, setUsername] = useState('');
  const [granularityOpen, setGranularityOpen] = useState(false);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [queryToDeploy, setQueryToDeploy] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle granularity selection
  const handleGranularitySelect = (value: string) => {
    setGranularity(value as GranularityLevel);
    setGranularityOpen(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get current date in EST timezone
  const getCurrentDateEST = (): Date => {
    const now = new Date();
    // EST is UTC-5 (or UTC-4 during daylight saving time)
    // For simplicity, we'll use UTC-5 (you can enhance this for DST)
    const estOffset = -5 * 60; // EST is UTC-5
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const estTime = new Date(utc + (estOffset * 60000));
    return estTime;
  };

  // Calculate relative date ranges
  const calculateRelativeDateRange = (relativeTerm: string): { startDate: string, endDate: string } => {
    const currentDate = getCurrentDateEST();
    let startDate: Date;
    let endDate: Date;

    const lowerTerm = relativeTerm.toLowerCase();
    
    // Check for "last X days" pattern first
    const lastXDaysPattern = /last\s+(\d+)\s+days?/i;
    const lastXDaysMatch = relativeTerm.match(lastXDaysPattern);
    
    if (lastXDaysMatch) {
      const numberOfDays = parseInt(lastXDaysMatch[1]);
      // Last X days ending yesterday
      endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() - 1); // Yesterday
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - (numberOfDays - 1)); // X days total
    } else if (lowerTerm.includes('last week')) {
      // Last 7 days ending yesterday
      endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() - 1); // Yesterday
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 6); // 7 days total
    } else if (lowerTerm.includes('last month')) {
      // Last 30 days ending yesterday
      endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() - 1); // Yesterday
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 29); // 30 days total
    } else if (lowerTerm.includes('today')) {
      startDate = new Date(currentDate);
      endDate = new Date(currentDate);
    } else if (lowerTerm.includes('yesterday')) {
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - 1);
      endDate = new Date(startDate);
    } else {
      // Default to today if unknown relative term
      startDate = new Date(currentDate);
      endDate = new Date(currentDate);
    }

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}${month}${day}`;
    };

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    };
  };

  // Enhanced date conversion function
  const convertToDateFormat = (dateStr: string): string => {
    const today = getCurrentDateEST();
    const currentYear = today.getFullYear();
    
    // Handle relative dates first
    const lowerDateStr = dateStr.toLowerCase();
    if (lowerDateStr.includes('last week') || lowerDateStr.includes('last month') || 
        lowerDateStr.includes('today') || lowerDateStr.includes('yesterday') ||
        /last\s+\d+\s+days?/i.test(dateStr)) {
      const range = calculateRelativeDateRange(dateStr);
      return range.startDate; // Return start date for single date conversion
    }
    
    // Handle various date formats
    const dateFormats = [
      // YYYYMMDD format
      /^(\d{4})(\d{2})(\d{2})$/,
      // YYYY-MM-DD format
      /^(\d{4})-(\d{2})-(\d{2})$/,
      // Natural language dates like "3rd august", "10th july"
      /^(\d{1,2})(st|nd|rd|th)?\s+(\w+)$/i,
      // Month names
      /^(\w+)\s+(\d{1,2})(st|nd|rd|th)?$/i,
    ];

    const monthNames = {
      'january': '01', 'jan': '01',
      'february': '02', 'feb': '02',
      'march': '03', 'mar': '03',
      'april': '04', 'apr': '04',
      'may': '05',
      'june': '06', 'jun': '06',
      'july': '07', 'jul': '07',
      'august': '08', 'aug': '08',
      'september': '09', 'sep': '09',
      'october': '10', 'oct': '10',
      'november': '11', 'nov': '11',
      'december': '12', 'dec': '12'
    };

    // Already in YYYYMMDD format
    if (dateFormats[0].test(dateStr)) {
      return dateStr;
    }

    // YYYY-MM-DD format
    const dashMatch = dateStr.match(dateFormats[1]);
    if (dashMatch) {
      return `${dashMatch[1]}${dashMatch[2]}${dashMatch[3]}`;
    }

    // Natural language: "3rd august", "10th july"
    const naturalMatch = dateStr.toLowerCase().match(dateFormats[2]);
    if (naturalMatch) {
      const day = naturalMatch[1].padStart(2, '0');
      const monthName = naturalMatch[3].toLowerCase();
      const month = monthNames[monthName as keyof typeof monthNames];
      if (month) {
        return `${currentYear}${month}${day}`;
      }
    }

    // Month first: "august 3rd", "july 10th"
    const monthFirstMatch = dateStr.toLowerCase().match(dateFormats[3]);
    if (monthFirstMatch) {
      const monthName = monthFirstMatch[1].toLowerCase();
      const day = monthFirstMatch[2].padStart(2, '0');
      const month = monthNames[monthName as keyof typeof monthNames];
      if (month) {
        return `${currentYear}${month}${day}`;
      }
    }

    return dateStr; // Return as-is if no pattern matches
  };

  // Enhanced intent extraction
  const extractIntent = (query: string): QueryIntent => {
    const lowerQuery = query.toLowerCase();
    
    // Extract date ranges with better parsing
    let extractedDates: string[] = [];
    
    // Check for relative dates first
    const relativeDatePattern = /(last\s+\d+\s+days?|last\s+week|last\s+month|today|yesterday)/gi;
    const relativeDateMatch = query.match(relativeDatePattern);
    
    if (relativeDateMatch) {
      // Handle relative dates by calculating the actual date range
      const relativeTerm = relativeDateMatch[0];
      const dateRange = calculateRelativeDateRange(relativeTerm);
      extractedDates.push(dateRange.startDate);
      extractedDates.push(dateRange.endDate);
    } else {
      // First, look for date ranges like "august 3rd to august 5th"
      const rangePattern = /(?:(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?)\s+to\s+(?:(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?)/gi;
      const rangeMatch = query.match(rangePattern);
      
      if (rangeMatch) {
        // Parse the range match to extract start and end dates
        const fullMatch = rangeMatch[0];
        const parts = fullMatch.split(/\s+to\s+/i);
        if (parts.length === 2) {
          extractedDates.push(parts[0].trim());
          extractedDates.push(parts[1].trim());
        }
      } else {
        // Fall back to individual date patterns
        const datePatterns = [
          /(\d{1,2})(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/gi,
          /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(st|nd|rd|th)?/gi,
          /(\d{4})-(\d{2})-(\d{2})/g,
          /(\d{8})/g
        ];

        datePatterns.forEach(pattern => {
          const matches = query.match(pattern);
          if (matches) {
            extractedDates = extractedDates.concat(matches);
          }
        });
      }
    }

    // Extract campaign IDs with improved regex
    const campaignPatterns = [
      /campaign\s*(?:id|identifier)?\s*[:\-]?\s*(\d+)/gi,
      /campaign\s+(\d+)/gi,
      /(?:^|\s)(\d{2,6})(?=\s|$)/g // Standalone numbers 2-6 digits
    ];

    let extractedCampaignIds: string[] = [];
    campaignPatterns.forEach(pattern => {
      const matches = [...query.matchAll(pattern)];
      matches.forEach(match => {
        if (match[1]) {
          extractedCampaignIds.push(match[1]);
        }
      });
    });

    // Analysis type detection
    let analysisType = '';
    const analysisKeywords = {
      'device': 'devices_analysis',
      'dma': 'dma_analysis', 
      'geo': 'geo_analysis',
      'audience': 'audience_analysis',
      'creative': 'creative_analysis',
      'frequency': 'reach_frequency',
      'reach': 'reach_frequency',
      'site': 'site_app_analysis',
      'app': 'site_app_analysis'
    };

    for (const [keyword, type] of Object.entries(analysisKeywords)) {
      if (lowerQuery.includes(keyword)) {
        analysisType = type;
        break;
      }
    }

    // Extract metrics
    const metrics = ['impressions', 'clicks', 'conversions', 'spend', 'revenue', 'ctr', 'cpm', 'reach', 'frequency']
      .filter(metric => lowerQuery.includes(metric));

    // Extract dimensions
    const dimensions = ['device', 'dma', 'geo', 'creative', 'placement', 'audience']
      .filter(dimension => lowerQuery.includes(dimension));

    return {
      analysisType,
      metrics,
      dimensions,
      dateRange: extractedDates.length > 0 ? extractedDates.join(' to ') : 'last 30 days',
      filters: extractedCampaignIds.length > 0 ? [`campaign_id IN (${extractedCampaignIds.join(', ')})`] : []
    };
  };

  // Apply granularity to SQL
  const applyGranularity = (sql: string, granularityLevel: GranularityLevel): string => {
    const lines = sql.split('\n');
    const selectIndex = lines.findIndex(line => line.trim().toLowerCase().startsWith('select'));
    const fromIndex = lines.findIndex(line => line.trim().toLowerCase().startsWith('from'));
    const groupByIndex = lines.findIndex(line => line.trim().toLowerCase().startsWith('group by'));

    if (selectIndex === -1 || fromIndex === -1) return sql;

    // Define granularity column patterns
    const granularityColumns = {
      campaign: [
        "dim_lookup('campaigns_by_id', ad_info_campaign_id, 'name') as Campaign_Name",
        "ad_info_campaign_id as Campaign_ID"
      ],
      line_item: [
        "dim_lookup('lineitems_by_id', ad_info_line_item_id, 'name') as LineItem_Name", 
        "ad_info_line_item_id as LineItem_ID"
      ],
      tactic: [
        "dim_lookup('tactics_by_id', ad_info_tactic_id, 'name') as Tactic_Name",
        "ad_info_tactic_id as Tactic_ID"
      ]
    };

    const granularityGroupBy = {
      campaign: [
        "dim_lookup('campaigns_by_id', ad_info_campaign_id, 'name')",
        "ad_info_campaign_id"
      ],
      line_item: [
        "dim_lookup('lineitems_by_id', ad_info_line_item_id, 'name')",
        "ad_info_line_item_id"  
      ],
      tactic: [
        "dim_lookup('tactics_by_id', ad_info_tactic_id, 'name')",
        "ad_info_tactic_id"
      ]
    };

    // Remove existing granularity columns from SELECT
    const beforeSelect = lines.slice(0, selectIndex);
    const selectToFrom = lines.slice(selectIndex, fromIndex);
    // Ensure fromToGroupBy NEVER includes GROUP BY content
    const fromToGroupBy = groupByIndex !== -1 ? lines.slice(fromIndex, groupByIndex) : lines.slice(fromIndex);
    // Skip the original GROUP BY line itself and any content after it
    const afterGroupBy = [];
    
    // Debug logging
    console.log('SQL Sections:');
    console.log('beforeSelect:', beforeSelect);
    console.log('selectToFrom:', selectToFrom);
    console.log('fromToGroupBy:', fromToGroupBy);
    console.log('afterGroupBy:', afterGroupBy);
    console.log('groupByIndex:', groupByIndex);

    // Clean SELECT section - remove existing granularity columns
    let cleanedSelectLines = selectToFrom.filter(line => {
      const trimmed = line.trim();
      // Remove any line that contains granularity-related patterns
      return !(trimmed.includes('campaigns_by_id') || 
               trimmed.includes('lineitems_by_id') || 
               trimmed.includes('tactics_by_id') ||
               trimmed.includes('Campaign_Name') ||
               trimmed.includes('Campaign_ID') ||
               trimmed.includes('LineItem_Name') ||
               trimmed.includes('LineItem_ID') ||
               trimmed.includes('Tactic_Name') ||
               trimmed.includes('Tactic_ID') ||
               trimmed.includes('ad_info_campaign_id') ||
               trimmed.includes('ad_info_line_item_id') ||
               trimmed.includes('ad_info_tactic_id') ||
               // Handle variations in naming
               trimmed.toLowerCase().includes('campaign') && (trimmed.includes('as Campaign') || trimmed.includes('as campaign')) ||
               trimmed.toLowerCase().includes('lineitem') ||
               trimmed.toLowerCase().includes('tactic'));
    });

    // Add selected granularity columns
    const newSelectLines = [...cleanedSelectLines];
    let columnsToAdd: string[] = [];

    switch (granularityLevel) {
      case 'campaign':
        columnsToAdd = granularityColumns.campaign;
        break;
      case 'line_item':
        columnsToAdd = granularityColumns.line_item;
        break;
      case 'tactic':
        columnsToAdd = granularityColumns.tactic;
        break;
      case 'campaign_line_item':
        columnsToAdd = [...granularityColumns.campaign, ...granularityColumns.line_item];
        break;
      case 'campaign_tactic':
        columnsToAdd = [...granularityColumns.campaign, ...granularityColumns.tactic];
        break;
      case 'line_item_tactic':
        columnsToAdd = [...granularityColumns.line_item, ...granularityColumns.tactic];
        break;
      case 'all':
        columnsToAdd = [...granularityColumns.campaign, ...granularityColumns.line_item, ...granularityColumns.tactic];
        break;
    }

    // Insert granularity columns after SELECT
    if (columnsToAdd.length > 0 && newSelectLines.length > 0) {
      const selectLine = newSelectLines[0];
      const afterSelectLines = newSelectLines.slice(1);
      
      const insertColumns = columnsToAdd.map((col, index) => 
        `  ${col}${index < columnsToAdd.length - 1 || afterSelectLines.length > 0 ? ',' : ''}`
      );
      
      newSelectLines.splice(1, 0, ...insertColumns);
    }

    // Rebuild GROUP BY - completely rewrite instead of filtering
    let newGroupByLines: string[] = [];
    if (groupByIndex !== -1) {
      // Helper to split a GROUP BY line by top-level commas (ignoring commas inside parentheses)
      const splitByTopLevelCommas = (input: string): string[] => {
        const parts: string[] = [];
        let current = '';
        let depth = 0;
        for (let i = 0; i < input.length; i++) {
          const ch = input[i];
          if (ch === '(') depth++;
          if (ch === ')') depth = Math.max(0, depth - 1);
          if (ch === ',' && depth === 0) {
            parts.push(current.trim());
            current = '';
            continue;
          }
          current += ch;
        }
        if (current.trim()) parts.push(current.trim());
        return parts.map(p => p.replace(/,$/, ''));
      };

      // Get GROUP BY columns from the header line (same-line columns)
      const groupByHeader = lines[groupByIndex] ?? '';
      const headerRemainder = groupByHeader.replace(/^\s*group\s+by\s*/i, '').trim();
      const headerColumns = headerRemainder
        ? splitByTopLevelCommas(headerRemainder)
        : [];

      // Get remaining GROUP BY columns (subsequent lines)
      const subsequentColumns = lines
        .slice(groupByIndex + 1, afterGroupBy.length > 0 ? lines.length - afterGroupBy.length : lines.length)
        .flatMap(line => splitByTopLevelCommas(line.trim()))
        .map(col => col.replace(/,$/, ''))
        .filter(col => col && col.trim());

      // Combine header and subsequent GROUP BY columns
      const originalGroupBy = [...headerColumns, ...subsequentColumns];

      // Extract non-granularity columns (preserve template-specific and other non-granularity columns)
      const nonGranularityColumns = originalGroupBy.filter(col => {
        const trimmed = col.trim();
        
        // Check if this is a standard granularity column that should be replaced
        const isStandardGranularity = (
          trimmed.includes('campaigns_by_id') || 
          trimmed.includes('lineitems_by_id') || 
          trimmed.includes('tactics_by_id') ||
          trimmed.includes('ad_info_campaign_id') ||
          trimmed.includes('ad_info_line_item_id') ||
          trimmed.includes('ad_info_tactic_id') ||
          // Check for dim_lookup with any quote style
          (trimmed.includes('dim_lookup') && trimmed.includes('campaigns_by_id')) ||
          (trimmed.includes('dim_lookup') && trimmed.includes('lineitems_by_id')) ||
          (trimmed.includes('dim_lookup') && trimmed.includes('tactics_by_id'))
        );
        
        // Debug logging
        console.log(`GROUP BY col: "${trimmed}" - isStandardGranularity: ${isStandardGranularity}`);
        
        // Keep non-standard granularity columns (like ad_info_ad_id, creative names, geo_dma, etc.)
        return !isStandardGranularity;
      });

      // Get selected granularity columns
      let selectedGranularityColumns: string[] = [];
      
      switch (granularityLevel) {
        case 'campaign':
          selectedGranularityColumns = granularityGroupBy.campaign;
          break;
        case 'line_item':
          selectedGranularityColumns = granularityGroupBy.line_item;
          break;
        case 'tactic':
          selectedGranularityColumns = granularityGroupBy.tactic;
          break;
        case 'campaign_line_item':
          selectedGranularityColumns = [...granularityGroupBy.campaign, ...granularityGroupBy.line_item];
          break;
        case 'campaign_tactic':
          selectedGranularityColumns = [...granularityGroupBy.campaign, ...granularityGroupBy.tactic];
          break;
        case 'line_item_tactic':
          selectedGranularityColumns = [...granularityGroupBy.line_item, ...granularityGroupBy.tactic];
          break;
        case 'all':
          selectedGranularityColumns = [...granularityGroupBy.campaign, ...granularityGroupBy.line_item, ...granularityGroupBy.tactic];
          break;
      }

      // Combine selected granularity with non-granularity columns
      const allGroupByColumns = [...selectedGranularityColumns, ...nonGranularityColumns];
      
      // Debug logging
      console.log(`Granularity Level: ${granularityLevel}`);
      console.log(`Selected Granularity Columns:`, selectedGranularityColumns);
      console.log(`Non-Granularity Columns:`, nonGranularityColumns);
      console.log(`Final GROUP BY Columns:`, allGroupByColumns);
      
      if (allGroupByColumns.length > 0) {
        newGroupByLines = ['GROUP BY'];
        allGroupByColumns.forEach((col, index) => {
          newGroupByLines.push(`    ${col}${index < allGroupByColumns.length - 1 ? ',' : ''}`);
        });
      }
    }

    console.log('Building final SQL with:');
    console.log('newGroupByLines:', newGroupByLines);
    console.log('newGroupByLines.length:', newGroupByLines.length);
    
    const finalSQL = [
      ...beforeSelect,
      ...newSelectLines,
      ...fromToGroupBy,
      ...(newGroupByLines.length > 0 ? newGroupByLines : []),
      ...afterGroupBy
    ].join('\n');
    
    console.log('Final SQL after applyGranularity:', finalSQL);
    
    return finalSQL;
  };

  // Generate SQL from intent and templates
  const generateSQL = (intent: QueryIntent, templates: SQLTemplate[]): string => {
    const bestTemplate = templates[0];
    
    // Enhanced date extraction and formatting
    const dateMatches = intent.dateRange.match(/^(.+?)(?:\s+to\s+(.+))?$/);
    let startDate = '20240801'; // Default
    let endDate = '20240805';   // Default
    
    if (dateMatches) {
      const startDateStr = dateMatches[1].trim();
      const endDateStr = dateMatches[2] ? dateMatches[2].trim() : startDateStr;
      
      // Check if it's already in YYYYMMDD format (from relative date calculation)
      if (/^\d{8}$/.test(startDateStr)) {
        startDate = startDateStr;
        endDate = endDateStr;
      } else {
        // Convert natural language dates
        startDate = convertToDateFormat(startDateStr);
        endDate = convertToDateFormat(endDateStr);
      }
    }

    // Enhanced campaign ID extraction
    let campaignId = '123'; // Default
    if (intent.filters.length > 0) {
      const campaignFilter = intent.filters[0];
      const campaignMatch = campaignFilter.match(/\d+/);
      if (campaignMatch) {
        campaignId = campaignMatch[0];
      }
    }

    // Generate timestamp for temp table name
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '').replace('T', '_');
    
    // Generate temp table name in format: temp_[analysis_type]_[timestamp]
    const analysisTypeClean = intent.analysisType.replace(/_/g, '').replace(/analysis/g, '');
    const tempTableName = `temp_${analysisTypeClean}_${timestamp}`;

    let sql = bestTemplate.template;
    
    // Replace placeholders
    sql = sql.replace(/\{\{temp_table\}\}/g, tempTableName);
    sql = sql.replace(/\{temp_table\}/g, tempTableName);
    sql = sql.replace(/\{\{start_date\}\}/g, startDate);
    sql = sql.replace(/\{\{end_date\}\}/g, endDate);
    sql = sql.replace(/\{\{campaign_id\}\}/g, campaignId);
    sql = sql.replace(/\{start_date\}/g, startDate);
    sql = sql.replace(/\{end_date\}/g, endDate);
    sql = sql.replace(/\{campaign_id\}/g, campaignId);

    // Apply selected granularity
    console.log('Original SQL before applyGranularity:', sql);
    sql = applyGranularity(sql, granularity);
    console.log('Modified SQL after applyGranularity:', sql);

    // Add comment header with granularity info
    const granularityLabels = {
      'campaign': 'Campaign level only',
      'line_item': 'Line Item level only', 
      'tactic': 'Tactic level only',
      'campaign_line_item': 'Campaign + Line Item levels',
      'campaign_tactic': 'Campaign + Tactic levels',
      'line_item_tactic': 'Line Item + Tactic levels',
      'all': 'All levels (Campaign + Line Item + Tactic)'
    };

    const granularityComment = `-- Temp Table: ${tempTableName}
-- Granularity: ${granularityLabels[granularity]}
-- Campaign ID: ${campaignId}
-- Date Range: ${startDate} to ${endDate}
-- Analysis Type: ${intent.analysisType}

`;

    return granularityComment + sql;
  };

  // Find relevant templates
  const findRelevantTemplates = (intent: QueryIntent): SQLTemplate[] => {
    return sqlTemplates.filter(template => {
      const matchesKeywords = template.keywords.some(keyword => 
        intent.analysisType.includes(keyword) ||
        intent.metrics.some(metric => keyword.includes(metric)) ||
        intent.dimensions.some(dim => keyword.includes(dim))
      );
      
      const matchesAnalysisType = template.id === intent.analysisType;
      
      return matchesAnalysisType || matchesKeywords;
    }).slice(0, 3);
  };

  // Extract report columns from SQL
  const extractReportColumns = (sql: string): string[] => {
    const lines = sql.split('\n');
    const selectIndex = lines.findIndex(line => line.trim().toLowerCase().startsWith('select'));
    const fromIndex = lines.findIndex(line => line.trim().toLowerCase().startsWith('from'));
    
    if (selectIndex === -1 || fromIndex === -1) return [];
    
    const selectLines = lines.slice(selectIndex + 1, fromIndex);
    const columns: string[] = [];
    
    selectLines.forEach(line => {
      const trimmed = line.trim().replace(/,$/, '');
      if (trimmed && !trimmed.startsWith('--')) {
        // Extract column alias or column name
        const asMatch = trimmed.match(/.*\s+as\s+(\w+)/i);
        if (asMatch) {
          columns.push(asMatch[1]);
        } else {
          // Try to extract simple column name
          const columnMatch = trimmed.match(/(\w+)$/);
          if (columnMatch) {
            columns.push(columnMatch[1]);
          }
        }
      }
    });
    
    return columns;
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Download query
  const downloadQuery = (sqlQuery: string) => {
    const blob = new Blob([sqlQuery], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Open deploy dialog
  const openDeployDialog = (sqlQuery: string) => {
    if (!sqlQuery) {
      toast({
        title: "No Query",
        description: "Cannot deploy an empty query.",
        variant: "destructive",
      });
      return;
    }
    setQueryToDeploy(sqlQuery);
    setTempUsername(username); // Pre-fill with last used username
    setDeployDialogOpen(true);
  };

  // Deploy query
  const handleDeploy = async () => {
    if (!tempUsername.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter your username to deploy the query.",
        variant: "destructive",
      });
      return;
    }

    setUsername(tempUsername); // Save username for future use
    setIsDeploying(true);
    setDeployDialogOpen(false);

    // Print the payload
    console.log("Deploy payload:", JSON.stringify({ data: queryToDeploy, username: tempUsername }));

    // Use the API base URL from environment variable
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://lsv-vm270.rfiserve.net:4000';
    const apiUrl = import.meta.env.DEV
      ? '/api/deploy-query'  // Development: use Vite proxy
      : `${apiBaseUrl}/api/deploy-query`;

    console.log(`Using API base URL: ${apiBaseUrl}`);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: queryToDeploy, username: tempUsername }),
      });
      const resultText = await response.text();
      if (response.ok) {
        toast({
          title: "Query Deployed!",
          description: resultText || "Your query was sent to the backend successfully.",
        });
      } else {
        toast({
          title: "Deploy Failed",
          description: resultText || `Server responded with status ${response.status}`,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Deploy Error",
        description: "Could not connect to backend server. Make sure you are connected to the corporate VPN.",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const intent = extractIntent(input);
      const relevantTemplates = findRelevantTemplates(intent);
      
      // Check if no templates found
      if (relevantTemplates.length === 0) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `Sorry, I couldn't find a matching template for your request.

To help me generate the right analysis, please include one of these supported analysis types in your query:

• DEVICE ANALYSIS
  → Use keywords like: device, mobile, desktop, tablet
  → Example: "Show me device performance for campaign 123"

• DMA ANALYSIS  
  → Use keywords like: dma, geography, metro, location
  → Example: "DMA analysis for campaign 456 from august 3rd to august 5th"

• GEOGRAPHIC ANALYSIS
  → Use keywords like: geo, geography, location
  → Example: "Geographic performance for campaign 789"

• AUDIENCE ANALYSIS
  → Use keywords like: audience, segment, demographic
  → Example: "Audience insights for campaign 456"

• CREATIVE ANALYSIS
  → Use keywords like: creative, ad, top, performing
  → Example: "Creative performance analysis for campaign 123"

• REACH & FREQUENCY ANALYSIS
  → Use keywords like: reach, frequency, unique
  → Example: "Reach and frequency for campaign 789"

• SITE & APP ANALYSIS
  → Use keywords like: site, app, publisher, placement
  → Example: "Site and app performance for campaign 456"

Please try your query again with one of these analysis types included.`,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, errorMessage]);
        return;
      }
      
      const sqlQuery = generateSQL(intent, relevantTemplates);
      const reportColumns = extractReportColumns(sqlQuery);

      // Enhanced date extraction for display
      const dateMatches = intent.dateRange.match(/^(.+?)(?:\s+to\s+(.+))?$/);
      let dateRange = intent.dateRange;
      let extractedCampaignId = 'Not specified';
      
      if (dateMatches) {
        const startDateStr = dateMatches[1].trim();
        const endDateStr = dateMatches[2] ? dateMatches[2].trim() : startDateStr;
        
        // Check if it's already in YYYYMMDD format (from relative date calculation)
        if (/^\d{8}$/.test(startDateStr)) {
          dateRange = `${startDateStr} to ${endDateStr}`;
        } else {
          // Convert natural language dates for display
          const startDate = convertToDateFormat(startDateStr);
          const endDate = convertToDateFormat(endDateStr);
          dateRange = `${startDate} to ${endDate}`;
        }
      }

      if (intent.filters.length > 0) {
        const campaignFilter = intent.filters[0];
        const campaignMatch = campaignFilter.match(/\d+/);
        if (campaignMatch) {
          extractedCampaignId = campaignMatch[0];
        }
      }

      const granularityLabels = {
        'campaign': 'Campaign level only',
        'line_item': 'Line Item level only', 
        'tactic': 'Tactic level only',
        'campaign_line_item': 'Campaign + Line Item levels',
        'campaign_tactic': 'Campaign + Tactic levels',
        'line_item_tactic': 'Line Item + Tactic levels',
        'all': 'All levels (Campaign + Line Item + Tactic)'
      };

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Query Analysis Complete ✅

I've successfully analyzed your request and found ${relevantTemplates.length} relevant template(s) from our knowledge base.

📋 Extracted Parameters:
• Date Range: ${dateRange}
• Campaign ID: ${extractedCampaignId}
• Analysis Type: ${intent.analysisType}
• Granularity: ${granularityLabels[granularity]}${intent.metrics.length > 0 ? `
• Metrics: ${intent.metrics.join(', ')}` : ''}${intent.dimensions.length > 0 ? `
• Dimensions: ${intent.dimensions.join(', ')}` : ''}

Analysis complete! Your request has been processed based on the specified requirements.`,
        timestamp: new Date(),
        intent,
        sqlQuery,
        reportColumns,
        templates: relevantTemplates,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing query:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exampleQueries = [
    "Generate a device query from 3rd august to 5th august for campaign id 123",
    "Show me DMA performance for campaign 456 last week",
    "Creative analysis for campaign 789 from 20240801 to 20240815", 
    "Site and app performance for campaign 147 from 10th july to 20th july",
    "Audience insights for campaign id 258 yesterday",
    "Reach and frequency analysis for campaign 369 from 1st june to 30th june"
  ];

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Top Controls: Mode Toggle and Granularity */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0 gap-4">
        {/* Granularity Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-purple-100">
              <Settings className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <Label className="text-sm font-medium text-gray-700">
              Granularity:
            </Label>
          </div>
          <Popover open={granularityOpen} onOpenChange={setGranularityOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={granularityOpen}
                className="w-64 justify-between shadow-sm border-gray-300 bg-white hover:bg-gray-50"
              >
                {granularityOptions.find((option) => option.value === granularity)?.label || "Select granularity..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search granularity..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No granularity found.</CommandEmpty>
                  <CommandGroup>
                    {granularityOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => handleGranularitySelect(option.value)}
                        className="cursor-pointer flex items-center gap-2"
                      >
                        <Checkbox
                          checked={granularity === option.value}
                          className="h-4 w-4"
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

      </div>

      {/* Welcome Message */}
      {messages.length === 0 && (
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 mb-4 flex-shrink-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Welcome to Studio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-6 text-lg leading-relaxed">
              {userMode === 'analyst' 
                ? 'Ask questions in natural language and I\'ll generate SQL queries from our comprehensive knowledge base of templates and schemas.'
                : 'Ask questions in natural language and I\'ll show you the report structure and columns that will be generated for your stakeholders.'
              }
            </p>
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="p-1 rounded-full bg-yellow-100">
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                </div>
                Try these example queries:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {exampleQueries.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 h-auto p-3 text-left justify-start whitespace-normal"
                    onClick={() => setInput(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages Container - This takes remaining space */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-0.5 bg-gradient-to-r from-purple-500 to-blue-400 rounded-xl shadow-inner">
          <div className="h-full bg-white rounded-lg p-4 overflow-y-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-4 max-w-5xl w-full ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                      : 'bg-gradient-to-br from-purple-500 to-purple-600'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                  
                  <div className="space-y-4 flex-1 min-w-0">
                    <Card className={`shadow-lg transition-all duration-200 hover:shadow-xl ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' 
                        : 'bg-white border-gray-200'
                    }`}>
                      <CardContent className="p-5">
                        <p className="text-gray-800 leading-relaxed whitespace-pre-line">{message.content}</p>
                        
                        {/* Dynamic mode-specific text */}
                        {message.sqlQuery && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-purple-500">
                            <p className="text-sm font-medium text-gray-700">
                              {userMode === 'analyst' 
                                ? '🔧 SQL query has been generated with the specified parameters and granularity.'
                                : '📊 Here are the report columns that will be generated for your stakeholders.'
                              }
                            </p>
                          </div>
                        )}
                      
                        {message.intent && (
                          <div className="mt-3 space-y-2">
                            <div className="flex flex-wrap gap-1">
                              {message.intent.metrics.map((metric: string) => (
                                <Badge key={metric} variant="outline" className="text-xs">
                                  {metric}
                                </Badge>
                              ))}
                              {message.intent.dimensions.map((dimension: string) => (
                                <Badge key={dimension} variant="secondary" className="text-xs">
                                  {dimension}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {message.sqlQuery && userMode === 'analyst' && (
                          <div className="mt-6 space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Generated SQL Query
                              </h4>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="shadow-sm hover:shadow-md transition-all duration-200"
                                  onClick={() => copyToClipboard(message.sqlQuery!)}
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="shadow-sm hover:shadow-md transition-all duration-200"
                                  onClick={() => openDeployDialog(message.sqlQuery!)}
                                  disabled={isDeploying}
                                >
                                  {isDeploying ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Rocket className="w-4 h-4 mr-2" />
                                  )}
                                  {isDeploying ? 'Deploying...' : 'Deploy'}
                                </Button>
                              </div>
                            </div>
                            <div className="bg-gray-900 rounded-lg p-4 border-2 border-gray-200 shadow-inner">
                              <Textarea
                                value={message.sqlQuery}
                                readOnly
                                className="font-mono text-sm bg-transparent text-green-400 border-0 resize-none focus:ring-0 min-h-[200px]"
                                rows={12}
                              />
                            </div>
                          </div>
                        )}

                        {message.reportColumns && userMode === 'account_manager' && (
                          <div className="mt-6 space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                Report Columns
                              </h4>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="shadow-sm hover:shadow-md transition-all duration-200"
                                  onClick={() => openDeployDialog(message.sqlQuery!)}
                                  disabled={isDeploying}
                                >
                                  {isDeploying ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Rocket className="w-4 h-4 mr-2" />
                                  )}
                                  {isDeploying ? 'Deploying...' : 'Deploy'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="shadow-sm hover:shadow-md transition-all duration-200"
                                  onClick={() => {
                                    const csvColumns = message.reportColumns!.join(',');
                                    const blob = new Blob([csvColumns], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'report_columns.csv';
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  }}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Export CSV
                                </Button>
                              </div>
                            </div>
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border-2 border-purple-200 shadow-inner">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {message.reportColumns.map((column, index) => (
                                  <div key={index} className="bg-white rounded-lg p-3 shadow-sm border border-purple-200">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                      <span className="font-medium text-gray-800">{column}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                                <p className="text-sm text-gray-600 mb-2 font-medium">📊 Report Summary:</p>
                                <p className="text-sm text-gray-700">
                                  This report will contain {message.reportColumns.length} columns with data broken down by your selected granularity level.
                                  Perfect for sharing with stakeholders and creating presentations.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {message.templates && message.templates.length > 0 && (
                          <div className="mt-6">
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              Knowledge Base Templates Used
                            </h4>
                            <div className="grid gap-3">
                              {message.templates.map((template) => (
                                <div key={template.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 shadow-sm">
                                  <div className="font-semibold text-blue-900 text-sm">{template.name}</div>
                                  <div className="text-blue-700 text-xs mt-1">{template.purpose}</div>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {template.keywords.slice(0, 3).map((keyword: string) => (
                                      <span key={keyword} className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                                        {keyword}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <Card className="flex-1 shadow-lg border-purple-200">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                      <div>
                        <span className="text-gray-800 font-medium">Analyzing your query...</span>
                        <div className="text-xs text-gray-500 mt-1">Searching knowledge base and generating SQL</div>
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-1 rounded-full animate-pulse" style={{width: '70%'}}></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Bottom Controls - Fixed at bottom */}
      <div className="space-y-4 mt-4 flex-shrink-0">
        <Card className="border-0 shadow-xl bg-white">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={userMode === 'analyst' 
                    ? "Ask me anything about your analytics data... (e.g., 'Generate a device query from 3rd august to 5th august for campaign id 123')"
                    : "Describe the report you need... (e.g., 'Show me device performance columns for campaign 123')"
                  }
                  className="pr-12 h-11 text-sm shadow-sm border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  disabled={isLoading}
                />
                {input && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                    onClick={() => setInput('')}
                  >
                    ×
                  </Button>
                )}
              </div>
              <Button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="h-11 px-6 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-purple-500 to-blue-400 hover:from-purple-600 hover:to-blue-500"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {userMode === 'analyst' ? 'Generate' : 'Build Report'}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Deploy Dialog */}
      <AlertDialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deploy Query</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your username to deploy this SQL query to the backend.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="deploy-username" className="text-sm font-medium text-gray-700">
              Username
            </Label>
            <Input
              id="deploy-username"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              placeholder="Enter your username"
              className="mt-2 shadow-sm border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleDeploy();
                }
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeployDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeploy}
              disabled={!tempUsername.trim() || isDeploying}
              className="bg-gradient-to-r from-purple-500 to-blue-400 hover:from-purple-600 hover:to-blue-500"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ConversationalAI;