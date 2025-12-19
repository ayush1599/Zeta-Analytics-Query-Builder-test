import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueryForm } from "./QueryForm";
import { QueryOutput } from "./QueryOutput";
import { Database, Sparkles } from "lucide-react";
import { useState } from "react";

interface QueryGeneratorLayoutProps {
  generatedQuery: string;
  isGenerating: boolean;
  onQuerySubmit: (data: any) => void;
}

export const QueryGeneratorLayout = ({ 
  generatedQuery, 
  isGenerating, 
  onQuerySubmit 
}: QueryGeneratorLayoutProps) => {
  const [currentFormData, setCurrentFormData] = useState<any>(null);
  const [generationKey, setGenerationKey] = useState<number>(0);

  const handleFormSubmit = (data: any) => {
    setCurrentFormData(data);
    setGenerationKey((k) => k + 1);
    onQuerySubmit(data);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-8 px-2 sm:px-4 md:px-8 w-full">
      {/* Query Form */}
      <div className="lg:col-span-3 w-full">
        <Card className="shadow-xl rounded-2xl border-none w-full">
          <CardHeader className="px-4 pt-4 pb-3 lg:px-6 lg:pt-6 lg:pb-4 flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-purple-600" />
            <CardTitle className="flex items-center gap-3 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
              Query Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <QueryForm 
              onSubmit={handleFormSubmit} 
              isGenerating={isGenerating}
            />
          </CardContent>
        </Card>
      </div>

      {/* Query Output */}
      <div className="lg:col-span-2 w-full mt-4 lg:mt-0">
        <Card className="shadow-xl rounded-2xl border-none h-full flex flex-col w-full">
          <CardHeader className="px-4 pt-4 pb-3 lg:px-6 lg:pt-6 lg:pb-4 flex items-center gap-3">
            <Database className="w-7 h-7 text-purple-600" />
            <CardTitle className="flex items-center gap-3 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
              Generated SQL
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <QueryOutput 
              query={generatedQuery} 
              isGenerating={isGenerating}
              formData={currentFormData}
              refreshKey={generationKey}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
