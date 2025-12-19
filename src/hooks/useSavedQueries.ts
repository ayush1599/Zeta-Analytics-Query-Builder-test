import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface SavedQuery {
  id: string;
  query: string;
  queryTypes: string[];
  campaignId?: string;
  lineItemId?: string;
  tacticId?: string;
  timestamp: Date;
  tags?: string[];
  metadata: {
    granularity: string;
    dateRange: {
      from: string;
      to: string;
    };
    conversionActionId?: string;
    pixelId?: string;
  };
}

const STORAGE_KEY = 'saved_queries';

export const useSavedQueries = () => {
  const { user } = useAuth();
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [filteredQueries, setFilteredQueries] = useState<SavedQuery[]>([]);
  const [filters, setFilters] = useState({
    campaignId: "",
    lineItemId: "",
    tacticId: "",
    queryType: "",
    tags: "",
  });

  // Load saved queries from localStorage
  useEffect(() => {
    if (!user) {
      setSavedQueries([]);
      setFilteredQueries([]);
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert string dates back to Date objects
        const queriesWithDates = parsed.map((q: any) => ({
          ...q,
          timestamp: new Date(q.timestamp)
        }));
        setSavedQueries(queriesWithDates);
        setFilteredQueries(queriesWithDates);
      }
    } catch (error) {
      console.error("Error loading saved queries:", error);
      toast({
        title: "Error loading queries",
        description: "Failed to load your local saved queries.",
        variant: "destructive",
      });
    }
  }, [user]);

  // Filter queries based on current filters
  useEffect(() => {
    let filtered = savedQueries;

    if (filters.campaignId) {
      filtered = filtered.filter(query =>
        query.campaignId?.toLowerCase().includes(filters.campaignId.toLowerCase())
      );
    }

    if (filters.lineItemId) {
      filtered = filtered.filter(query =>
        query.lineItemId?.toLowerCase().includes(filters.lineItemId.toLowerCase())
      );
    }

    if (filters.tacticId) {
      filtered = filtered.filter(query =>
        query.tacticId?.toLowerCase().includes(filters.tacticId.toLowerCase())
      );
    }

    if (filters.queryType) {
      filtered = filtered.filter(query =>
        query.queryTypes.some(type =>
          type.toLowerCase().includes(filters.queryType.toLowerCase())
        )
      );
    }

    if (filters.tags) {
      filtered = filtered.filter(query =>
        query.tags?.some(tag =>
          tag.toLowerCase().includes(filters.tags.toLowerCase())
        )
      );
    }

    setFilteredQueries(filtered);
  }, [savedQueries, filters]);

  const saveQuery = async (queryData: {
    query: string;
    queryTypes: string[];
    idField: any;
    metadata: any;
    tags?: string[];
  }) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save queries.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newQuery: SavedQuery = {
        id: crypto.randomUUID(),
        query: queryData.query,
        queryTypes: queryData.queryTypes,
        campaignId: queryData.idField.type === 'campaign_id' ? queryData.idField.value : undefined,
        lineItemId: queryData.idField.type === 'line_item_id' ? queryData.idField.value : undefined,
        tacticId: queryData.idField.type === 'tactic_id' ? queryData.idField.value : undefined,
        timestamp: new Date(),
        tags: queryData.tags || [],
        metadata: queryData.metadata,
      };

      const updatedQueries = [newQuery, ...savedQueries];
      setSavedQueries(updatedQueries);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQueries));

      toast({
        title: "Query Saved!",
        description: "Your query has been saved to local history.",
      });
    } catch (error) {
      console.error("Error saving query:", error);
      toast({
        title: "Error saving query",
        description: "Failed to save your query locally.",
        variant: "destructive",
      });
    }
  };

  const deleteQuery = async (id: string) => {
    try {
      const updatedQueries = savedQueries.filter(query => query.id !== id);
      setSavedQueries(updatedQueries);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQueries));

      toast({
        title: "Query Deleted",
        description: "The query has been removed from your history.",
      });
    } catch (error) {
      console.error("Error deleting query:", error);
      toast({
        title: "Error deleting query",
        description: "Failed to delete the query.",
        variant: "destructive",
      });
    }
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      campaignId: "",
      lineItemId: "",
      tacticId: "",
      queryType: "",
      tags: "",
    });
  };

  return {
    savedQueries,
    filteredQueries,
    filters,
    saveQuery,
    deleteQuery,
    updateFilters,
    clearFilters,
  };
};