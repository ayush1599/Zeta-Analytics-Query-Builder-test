import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
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

  // Load saved queries from Supabase on mount and when user changes
  useEffect(() => {
    if (!user) {
      setSavedQueries([]);
      setFilteredQueries([]);
      return;
    }

    const loadQueries = async () => {
      try {
        const { data, error } = await supabase
          .from('saved_queries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Convert database format to app format
        const queriesWithDates = data.map((query: any) => ({
          id: query.id,
          query: query.query,
          queryTypes: query.query_types,
          campaignId: query.campaign_id,
          lineItemId: query.line_item_id,
          tacticId: query.tactic_id,
          timestamp: new Date(query.timestamp),
          tags: query.tags || [],
          metadata: query.metadata,
        }));

        setSavedQueries(queriesWithDates);
        setFilteredQueries(queriesWithDates);
      } catch (error) {
        console.error("Error loading saved queries:", error);
        toast({
          title: "Error loading queries",
          description: "Failed to load your saved queries.",
          variant: "destructive",
        });
      }
    };

    loadQueries();
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
      const newQuery = {
        user_id: user.id,
        query: queryData.query,
        query_types: queryData.queryTypes,
        campaign_id: queryData.idField.type === 'campaign_id' ? queryData.idField.value : null,
        line_item_id: queryData.idField.type === 'line_item_id' ? queryData.idField.value : null,
        tactic_id: queryData.idField.type === 'tactic_id' ? queryData.idField.value : null,
        timestamp: new Date().toISOString(),
        tags: queryData.tags || [],
        metadata: queryData.metadata,
      };

      const { data, error } = await supabase
        .from('saved_queries')
        .insert([newQuery])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      const savedQuery: SavedQuery = {
        id: data.id,
        query: data.query,
        queryTypes: data.query_types,
        campaignId: data.campaign_id,
        lineItemId: data.line_item_id,
        tacticId: data.tactic_id,
        timestamp: new Date(data.timestamp),
        tags: data.tags || [],
        metadata: data.metadata,
      };

      setSavedQueries(prev => [savedQuery, ...prev]);
      
      toast({
        title: "Query Saved!",
        description: "Your query has been saved to your history.",
      });
    } catch (error) {
      console.error("Error saving query:", error);
      toast({
        title: "Error saving query",
        description: "Failed to save your query. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteQuery = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_queries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavedQueries(prev => prev.filter(query => query.id !== id));
      
      toast({
        title: "Query Deleted",
        description: "The query has been removed from your history.",
      });
    } catch (error) {
      console.error("Error deleting query:", error);
      toast({
        title: "Error deleting query",
        description: "Failed to delete the query. Please try again.",
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