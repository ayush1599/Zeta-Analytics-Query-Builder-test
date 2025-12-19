import { useQueryGeneration } from "@/hooks/useQueryGeneration";
import { PageHeader } from "@/components/PageHeader";
import { QueryGeneratorLayout } from "@/components/QueryGeneratorLayout";
import { PageFooter } from "@/components/PageFooter";

const Index = () => {
  const { generatedQuery, isGenerating, handleQueryGeneration } = useQueryGeneration();

  return (
    <div className="min-h-screen bg-slate-100" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <PageHeader />
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
        <QueryGeneratorLayout 
          generatedQuery={generatedQuery}
          isGenerating={isGenerating}
          onQuerySubmit={handleQueryGeneration}
        />
        <PageFooter />
      </main>
    </div>
  );
};

export default Index;
