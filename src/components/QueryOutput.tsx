import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Check, Clipboard, Download, FileText, Loader2, Upload, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSavedQueries } from "@/hooks/useSavedQueries";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface QueryOutputProps {
  query: string;
  isGenerating: boolean;
  formData?: any;
  refreshKey?: number;
}

export const QueryOutput = ({ query: generatedQuery, isGenerating, formData, refreshKey }: QueryOutputProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResponse, setDeployResponse] = useState<string | null>(null);
  const [editableQuery, setEditableQuery] = useState(generatedQuery);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [username, setUsername] = useState("");
  const { saveQuery } = useSavedQueries();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // -- Simple highlighter: color SQL comments (lines starting with --) in green
  const escapeHtml = (input: string) =>
    input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const highlightedHtml = (() => {
    if (!editableQuery) return "";
    const lines = editableQuery.split(/\n/);
    const htmlLines = lines.map((line) => {
      const escaped = escapeHtml(line);
      if (/^\s*--/.test(line)) {
        return `<span class=\"text-green-400\">${escaped}</span>`;
      }
      return escaped;
    });
    return htmlLines.join("\n");
  })();

  useEffect(() => {
    setEditableQuery(generatedQuery);
  }, [generatedQuery, refreshKey]);

  // Keep overlay scroll in sync with textarea
  const handleScrollSync = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleCopy = async () => {
    if (!editableQuery) return;
    
    try {
      await navigator.clipboard.writeText(editableQuery);
      setIsCopied(true);
      toast({
        title: "Copied to clipboard!",
        description: "SQL query has been copied to your clipboard.",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!editableQuery) return;
    
    const blob = new Blob([editableQuery], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_query_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Your SQL file is being downloaded as a .txt file.",
    });
  };

  const handleSaveClick = () => {
    if (!editableQuery || !formData) {
      toast({
        title: "Cannot Save",
        description: "No query or form data available to save.",
        variant: "destructive",
      });
      return;
    }
    setShowSaveDialog(true);
  };

  const handleSave = () => {
    if (!editableQuery || !formData) {
      toast({
        title: "Cannot Save",
        description: "No query or form data available to save.",
        variant: "destructive",
      });
      return;
    }

    saveQuery({
      query: editableQuery,
      queryTypes: formData.analysisTypes,
      idField: formData.idField,
      metadata: {
        granularity: formData.granularity,
        dateRange: formData.dateRange,
        conversionActionId: formData.conversionActionId,
        pixelId: formData.pixelId,
      },
      tags: tags,
    });

    setShowSaveDialog(false);
    setTags([]);
    setTagInput("");
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleDeploy = async () => {
    let sqlToDeploy = editableQuery;
    if (textareaRef.current) {
      const { selectionStart, selectionEnd, value } = textareaRef.current;
      if (selectionStart !== selectionEnd) {
        sqlToDeploy = value.substring(selectionStart, selectionEnd);
      }
    }
    if (!sqlToDeploy) {
      toast({
        title: "No Query",
        description: "Cannot deploy an empty query.",
        variant: "destructive",
      });
      return;
    }
    setIsDeploying(true);
    setDeployResponse(null);

    // Print the payload
    console.log("Deploy payload:", JSON.stringify({ data: sqlToDeploy, username }));

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
        body: JSON.stringify({ data: sqlToDeploy, username }),
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

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="text-slate-600">Generating your SQL query...</p>
      </div>
    );
  }

  if (!generatedQuery) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <FileText className="w-12 h-12 mb-4 text-slate-400" />
        <h3 className="text-lg font-semibold text-slate-700">Your generated SQL will appear here</h3>
        <p className="text-sm text-slate-500 max-w-xs mt-2">
          Fill out the form and click "Generate Query" to see your SQL output here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Button onClick={handleCopy} variant="outline" className="w-full">
          {isCopied ? (
            <>
              <Check className="w-5 h-5 mr-2 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Clipboard className="w-5 h-5 mr-2" />
              Copy SQL
            </>
          )}
        </Button>
        <Button onClick={handleDownload} variant="outline" className="w-full">
          <Download className="w-5 h-5 mr-2" />
          Download
        </Button>
        <Button 
          onClick={handleSaveClick} 
          variant="outline" 
          className="w-full bg-white border border-gray-200 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors"
          style={{ color: '#352f36' }}
          disabled={!formData}
        >
          <Save className="w-5 h-5 mr-2" />
          Save
        </Button>
      </div>

      <div className="flex-1 relative mb-4 bg-slate-900 rounded-2xl">
        <pre
          ref={preRef}
          className="absolute inset-0 p-6 text-sm font-mono leading-relaxed text-white whitespace-pre-wrap break-words overflow-auto pointer-events-none rounded-2xl"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
        <textarea
          ref={textareaRef}
          value={editableQuery}
          onChange={(e) => setEditableQuery(e.target.value)}
          onScroll={handleScrollSync}
          className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white selection:bg-white/20 rounded-2xl p-6 text-sm font-mono leading-relaxed border-none resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 overflow-auto"
          spellCheck="false"
        />
      </div>
      
      {/* Save Query Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Query</AlertDialogTitle>
            <AlertDialogDescription>
              Add optional tags to help organize your saved queries. Tags can be used to filter queries in the history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  placeholder="Enter tag and press Enter (e.g., client name)"
                  className="flex-1"
                />
                <Button onClick={addTag} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <span key={index} className="flex items-center gap-1">
                      <Badge variant="secondary">{tag}</Badge>
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-600"
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowSaveDialog(false);
              setTags([]);
              setTagInput("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>
              Save Query
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0">
              <Upload className="w-6 h-6 mr-3" />
              Deploy Query
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deploy Query</AlertDialogTitle>
              <AlertDialogDescription>
                This will send your query to the backend for deployment. No credentials are required.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="deploy-username">Username</Label>
                <Input
                  id="deploy-username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full"
                />
              </div>
              <div className="text-sm text-gray-600">
                Are you sure you want to deploy this query?
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeploy} disabled={isDeploying}>
                {isDeploying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : "Deploy"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
