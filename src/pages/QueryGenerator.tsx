import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryGeneration } from "@/hooks/useQueryGeneration";
import { useSavedQueries } from "@/hooks/useSavedQueries";
import { QueryGeneratorLayout } from "@/components/QueryGeneratorLayout";
import { PageFooter } from "@/components/PageFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Database, 
  History, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Tag, 
  Copy, 
  Download, 
  Trash2,
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";

const FILTER_OPTIONS = [
  { label: "Campaign ID", value: "campaignId" },
  { label: "Line Item ID", value: "lineItemId" },
  { label: "Tactic ID", value: "tacticId" },
  { label: "Query Type", value: "queryType" },
  { label: "Tags", value: "tags" },
];

const QueryGenerator = () => {
  const navigate = useNavigate();
  const { generatedQuery, isGenerating, handleQueryGeneration } = useQueryGeneration();
  const { 
    filteredQueries, 
    filters, 
    updateFilters, 
    clearFilters, 
    deleteQuery, 
    savedQueries
  } = useSavedQueries();
  
  const [activeTab, setActiveTab] = useState("generator");
  const [expandedQueries, setExpandedQueries] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'timestamp' | 'queryType'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFilter, setSelectedFilter] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");

  const handleBackToHome = () => {
    navigate("/");
  };

  // Apply filter when filterValue or selectedFilter changes
  const handleFilterChange = (type: string) => {
    setSelectedFilter(type);
    setFilterValue("");
    updateFilters({
      campaignId: type === "campaignId" ? "" : "",
      lineItemId: type === "lineItemId" ? "" : "",
      tacticId: type === "tacticId" ? "" : "",
      queryType: type === "queryType" ? "" : "",
      tags: type === "tags" ? "" : "",
    });
  };

  const handleValueChange = (value: string) => {
    setFilterValue(value);
    updateFilters({
      campaignId: selectedFilter === "campaignId" ? value : "",
      lineItemId: selectedFilter === "lineItemId" ? value : "",
      tacticId: selectedFilter === "tacticId" ? value : "",
      queryType: selectedFilter === "queryType" ? value : "",
      tags: selectedFilter === "tags" ? value : "",
    });
  };

  const handleClearFilters = () => {
    setFilterValue("");
    setSelectedFilter("");
    clearFilters();
  };

  const toggleExpanded = (queryId: string) => {
    const newExpanded = new Set(expandedQueries);
    if (newExpanded.has(queryId)) {
      newExpanded.delete(queryId);
    } else {
      newExpanded.add(queryId);
    }
    setExpandedQueries(newExpanded);
  };

  const handleCopyQuery = async (query: string) => {
    try {
      await navigator.clipboard.writeText(query);
      toast.success("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleSort = (field: 'timestamp' | 'queryType') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedQueries = [...filteredQueries].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'timestamp') {
      comparison = a.timestamp.getTime() - b.timestamp.getTime();
    } else if (sortBy === 'queryType') {
      comparison = a.queryTypes.join(', ').localeCompare(b.queryTypes.join(', '));
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getQueryTypeBadgeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'performance_report': 'bg-blue-100 text-blue-800',
      'dma': 'bg-green-100 text-green-800',
      'frequency_lag': 'bg-purple-100 text-purple-800',
      'omnichannel_lift': 'bg-orange-100 text-orange-800',
      'attribution': 'bg-red-100 text-red-800',
      'reach_frequency': 'bg-indigo-100 text-indigo-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="w-full px-0 py-1 relative" style={{ maxWidth: '100vw' }}>
          <div className="flex items-center justify-center relative min-h-[48px]">
            {/* Left: Back to Home */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center pl-4">
              <Button
                onClick={handleBackToHome}
                className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 hover:text-gray-900 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-4 py-2 font-medium"
                size="sm"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-400 flex items-center justify-center shadow-md">
                    <ArrowLeft className="w-3 h-3 text-white" />
                  </div>
                  <span>Back to Home</span>
                </div>
              </Button>
            </div>
            {/* Center: Navigation Tabs */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <nav className="flex bg-purple-50 rounded-full p-0.5 shadow-inner border border-purple-100 gap-0">
                <button
                  onClick={() => setActiveTab("generator")}
                  className={cn(
                    'flex items-center justify-center gap-2 min-w-[160px] h-8 text-sm font-semibold transition-colors focus:outline-none',
                    'rounded-full',
                    activeTab === "generator"
                      ? 'bg-gradient-to-r from-purple-500 to-blue-400 text-white shadow-md'
                      : 'text-purple-700 hover:bg-purple-100',
                  )}
                  style={{ zIndex: activeTab === "generator" ? 2 : 1 }}
                >
                  <Database className="w-4 h-4" />
                  Generator
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={cn(
                    'flex items-center justify-center gap-2 min-w-[160px] h-8 text-sm font-semibold transition-colors focus:outline-none',
                    'rounded-full',
                    activeTab === "history"
                      ? 'bg-gradient-to-r from-purple-500 to-blue-400 text-white shadow-md'
                      : 'text-purple-700 hover:bg-purple-100',
                  )}
                  style={{ zIndex: activeTab === "history" ? 2 : 1 }}
                >
                  <History className="w-4 h-4" />
                  History
                </button>
              </nav>
            </div>
            {/* Right: Spacer */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center pr-4">
              <div className="w-24"></div> {/* Spacer for centering */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <TabsContent value="generator">
            <QueryGeneratorLayout 
              generatedQuery={generatedQuery}
              isGenerating={isGenerating}
              onQuerySubmit={handleQueryGeneration}
            />
          </TabsContent>

          <TabsContent value="history">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Query History</h1>
              <p className="text-gray-600">View and manage your saved queries</p>
            </div>

            {/* Filters */}
            <Card className="mb-6 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-purple-600" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-end gap-3">
                  <div className="w-full md:w-1/3 flex flex-col">
                    <Label htmlFor="filter-type" className="mb-2 text-sm font-medium text-gray-700">Filter By</Label>
                    <Select value={selectedFilter} onValueChange={handleFilterChange}>
                      <SelectTrigger className="h-10 text-base font-normal rounded-lg border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-400 px-3">
                        <SelectValue placeholder={<span className="text-base font-normal text-muted-foreground">Select filter type...</span>} className="text-base font-normal text-muted-foreground" />
                      </SelectTrigger>
                      <SelectContent>
                        {FILTER_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} className="text-base font-normal">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-1/3 flex flex-col">
                    <Label htmlFor="filter-value" className="mb-2 text-sm font-medium text-gray-700">Value</Label>
                    <Input
                      id="filter-value"
                      placeholder={selectedFilter ? `Enter ${FILTER_OPTIONS.find(opt => opt.value === selectedFilter)?.label || "value"}...` : "Select filter type first..."}
                      value={filterValue}
                      onChange={e => handleValueChange(e.target.value)}
                      className="h-10 text-base rounded-lg border border-slate-200 shadow-sm placeholder:text-muted-foreground px-3"
                      disabled={!selectedFilter}
                    />
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      className="flex items-center gap-2 text-sm px-3 h-10 min-w-max"
                    >
                      <X className="w-4 h-4" />
                      Clear Filters
                    </Button>
                  </div>
                  <div className="flex items-center ml-auto text-sm text-gray-500">
                    {filteredQueries.length} of {savedQueries.length} queries
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Query List */}
            <div className="space-y-4">
              {sortedQueries.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {filteredQueries.length === 0 && (filterValue || selectedFilter) 
                        ? "No queries match your filters" 
                        : "No saved queries yet"}
                    </h3>
                    <p className="text-gray-500">
                      {filteredQueries.length === 0 && (filterValue || selectedFilter)
                        ? "Try adjusting your filters or clear them to see all queries."
                        : "Generate and save your first query to see it here."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                sortedQueries.map((query) => (
                  <Card key={query.id} className="shadow-sm hover:shadow-md transition-shadow rounded-xl border border-slate-100 hover:bg-slate-50 group">
                    <CardContent className="py-0 px-3">
                      {/* Header Row */}
                      <div className="flex items-center justify-between h-[48px] w-full">
                        <div className="flex items-center gap-6 min-w-0 h-full w-full">
                          <div className="flex flex-wrap gap-2 items-center h-full">
                            {query.queryTypes.map((type) => (
                              <Badge 
                                key={type} 
                                className={getQueryTypeBadgeColor(type) + " px-3 h-7 text-xs rounded-full font-medium lowercase flex items-center"}
                              >
                                {type.replace('_', ' ')}
                              </Badge>
                            ))}
                            {query.tags && query.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {query.tags.map((tag, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="outline"
                                    className="px-2 h-6 text-xs rounded-full font-medium bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-base font-semibold text-gray-700 truncate h-full">
                            <Tag className="w-4 h-4 text-gray-400" />
                            {query.campaignId && `Campaign: ${query.campaignId}`}
                            {query.lineItemId && `Line Item: ${query.lineItemId}`}
                            {query.tacticId && `Tactic: ${query.tacticId}`}
                            {!query.campaignId && !query.lineItemId && !query.tacticId && 'All IDs'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 h-full">
                          <div className="flex items-center gap-1 text-xs text-gray-400 font-normal h-full">
                            <Clock className="w-4 h-4" />
                            {formatTimestamp(query.timestamp)}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-purple-600"
                            onClick={() => toggleExpanded(query.id)}
                            aria-label={expandedQueries.has(query.id) ? 'Collapse' : 'Expand'}
                          >
                            {expandedQueries.has(query.id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Query Content */}
                      {expandedQueries.has(query.id) && (
                        <div className="border-t pt-4 space-y-4">
                          {/* Metadata */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Granularity:</span>
                              <span className="ml-2 text-gray-600">{query.metadata?.granularity || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Date Range:</span>
                              <span className="ml-2 text-gray-600">
                                {query.metadata?.dateRange ? 
                                  `${new Date(query.metadata.dateRange.from).toLocaleDateString()} - ${new Date(query.metadata.dateRange.to).toLocaleDateString()}` 
                                  : 'N/A'}
                              </span>
                            </div>
                            {query.metadata?.conversionActionId && (
                              <div>
                                <span className="font-medium text-gray-700">Conversion Action:</span>
                                <span className="ml-2 text-gray-600">{query.metadata.conversionActionId}</span>
                              </div>
                            )}
                            {query.metadata?.pixelId && (
                              <div>
                                <span className="font-medium text-gray-700">Pixel ID:</span>
                                <span className="ml-2 text-gray-600">{query.metadata.pixelId}</span>
                              </div>
                            )}
                          </div>

                          {/* Query SQL */}
                          <div className="relative">
                            <div className="flex justify-between items-center mb-2">
                              <Label className="text-sm font-medium">Generated SQL</Label>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyQuery(query.query)}
                                  className="flex items-center gap-2"
                                >
                                  <Copy className="w-4 h-4" />
                                  Copy
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteQuery(query.id)}
                                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                            <div className="bg-slate-900 text-white rounded-lg p-4 overflow-x-auto">
                              <pre className="text-sm font-mono whitespace-pre-wrap">
                                {query.query}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <PageFooter />
      </main>
    </div>
  );
};

export default QueryGenerator;
