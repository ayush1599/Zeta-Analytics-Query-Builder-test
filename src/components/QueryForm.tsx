import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, Sparkles, Database, Calendar, Filter, Layers } from "lucide-react";
import { AnalysisTypeSelector } from "./AnalysisTypeSelector";
import { GranularitySelector } from "./GranularitySelector";
import { DateRangePicker } from "./DateRangePicker";
import { OmnichannelLiftConfig } from "./OmnichannelLiftConfig";
import { Separator } from "@/components/ui/separator";

interface QueryFormProps {
  onSubmit: (data: any) => void;
  isGenerating: boolean;
}

const FormSection = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-3 mb-4">
      {icon}
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="pl-9">{children}</div>
  </div>
);

export const QueryForm = ({ onSubmit, isGenerating }: QueryFormProps) => {
  const [analysisTypes, setAnalysisTypes] = useState<string[]>([]);
  const [granularity, setGranularity] = useState<string>("");
  const [idFieldType, setIdFieldType] = useState<string>("campaign_id");
  const [idFieldValue, setIdFieldValue] = useState<string>("");
  const [conversionActionId, setConversionActionId] = useState<string>("");
  const [pixelId, setPixelId] = useState<string>("");
  const [dateRange, setDateRange] = useState<any>(null);
  const [omnichannelConfig, setOmnichannelConfig] = useState<any>(null);

  const analysisTypesRequiringConversionId = ["survey", "website_analysis", "path_to_conversion", "ctv_attributes"];
  const analysisTypesRequiringPixelId = ["website_visitor_insights", "frequency_lag"];

  const needsConversionActionId = analysisTypes.some(type => analysisTypesRequiringConversionId.includes(type));
  const needsPixelId = analysisTypes.some(type => analysisTypesRequiringPixelId.includes(type));
  const needsOmnichannelConfig = analysisTypes.includes("omnichannel_lift");

  const isFormValid =
    analysisTypes.length > 0 &&
    granularity &&
    (needsOmnichannelConfig || idFieldType === "all" || idFieldValue.trim()) &&
    dateRange?.from &&
    dateRange?.to &&
    (!needsConversionActionId || conversionActionId.trim()) &&
    (!needsPixelId || pixelId.trim()) &&
    (!needsOmnichannelConfig || (omnichannelConfig?.channel1?.type && omnichannelConfig?.channel2?.type && omnichannelConfig?.channel1?.ids && omnichannelConfig?.channel2?.ids));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    onSubmit({
      analysisTypes,
      granularity,
      idField: { type: idFieldType, value: idFieldValue },
      conversionActionId,
      pixelId,
      dateRange,
      omnichannelConfig
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <FormSection title="Query Type(s)" icon={<Sparkles className="w-6 h-6 text-purple-600" />}>
        <AnalysisTypeSelector selectedTypes={analysisTypes} onSelectionChange={setAnalysisTypes} />
      </FormSection>

      <Separator />

      {needsOmnichannelConfig && (
        <>
          <FormSection title="Omnichannel Lift Configuration" icon={<Database className="w-6 h-6 text-purple-600" />}>
            <OmnichannelLiftConfig onConfigChange={setOmnichannelConfig} />
          </FormSection>
          <Separator />
        </>
      )}

      <FormSection title="Granularity" icon={<Layers className="w-6 h-6 text-purple-600" />}>
        <GranularitySelector selectedGranularity={granularity} onSelectionChange={setGranularity} />
      </FormSection>

      <Separator />

      <FormSection title="Filter" icon={<Filter className="w-6 h-6 text-purple-600" />}>
        <RadioGroup value={idFieldType} onValueChange={setIdFieldType} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 flex items-center p-[2px] bg-white rounded-lg">
            <RadioGroupItem value="campaign_id" id="filter-campaign_id" />
            <Label htmlFor="filter-campaign_id" className="w-full text-center cursor-pointer rounded-lg px-4 py-3 text-base font-semibold transition-all duration-200 ease-in-out bg-white text-gray-900 border-2 border-slate-200 shadow-sm hover:bg-slate-50 peer-data-[state=checked]:bg-gradient-to-r peer-data-[state=checked]:from-blue-500 peer-data-[state=checked]:to-purple-600 peer-data-[state=checked]:text-white peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:border-white">Campaign ID</Label>
          </div>
          <div className="flex-1 flex items-center p-[2px] bg-white rounded-lg">
            <RadioGroupItem value="line_item_id" id="filter-line_item_id" />
            <Label htmlFor="filter-line_item_id" className="w-full text-center cursor-pointer rounded-lg px-4 py-3 text-base font-semibold transition-all duration-200 ease-in-out bg-white text-gray-900 border-2 border-slate-200 shadow-sm hover:bg-slate-50 peer-data-[state=checked]:bg-gradient-to-r peer-data-[state=checked]:from-blue-500 peer-data-[state=checked]:to-purple-600 peer-data-[state=checked]:text-white peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:border-white">Line Item ID</Label>
          </div>
          <div className="flex-1 flex items-center p-[2px] bg-white rounded-lg">
            <RadioGroupItem value="tactic_id" id="filter-tactic_id" />
            <Label htmlFor="filter-tactic_id" className="w-full text-center cursor-pointer rounded-lg px-4 py-3 text-base font-semibold transition-all duration-200 ease-in-out bg-white text-gray-900 border-2 border-slate-200 shadow-sm hover:bg-slate-50 peer-data-[state=checked]:bg-gradient-to-r peer-data-[state=checked]:from-blue-500 peer-data-[state=checked]:to-purple-600 peer-data-[state=checked]:text-white peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:border-white">Tactic ID</Label>
          </div>
        </RadioGroup>
        {idFieldType !== "all" && !needsOmnichannelConfig && (
          <div className="mt-4">
            <Input
              type="text"
              placeholder={`Enter ${idFieldType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}(s)`}
              value={idFieldValue}
              onChange={(e) => setIdFieldValue(e.target.value)}
              className="w-full"
            />
          </div>
        )}
      </FormSection>

      <Separator />

      {needsConversionActionId && (
        <>
          <FormSection title="Conversion Action ID(s)" icon={<Database className="w-6 h-6 text-purple-600" />}>
            <Input
              type="text"
              placeholder="Enter IDs (comma-separated)"
              value={conversionActionId}
              onChange={(e) => setConversionActionId(e.target.value)}
              className="w-full"
            />
          </FormSection>
          <Separator />
        </>
      )}

      {needsPixelId && (
        <>
          <FormSection title="Pixel / Conversion ID(s)" icon={<Database className="w-6 h-6 text-purple-600" />}>
            <Input
              type="text"
              placeholder="Enter IDs (comma-separated)"
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
              className="w-full"
            />
          </FormSection>
          <Separator />
        </>
      )}

      <FormSection title="Date Range" icon={<Calendar className="w-6 h-6 text-purple-600" />}>
        <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
      </FormSection>

      <div className="pt-4">
        <Button
          type="submit"
          disabled={!isFormValid || isGenerating}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0"
        >
          {isGenerating ? (
            <><Loader2 className="w-6 h-6 mr-3 animate-spin" />Generating...</>
          ) : (
            <><Sparkles className="w-6 h-6 mr-3" />Generate Query</>
          )}
        </Button>
      </div>
    </form>
  );
};
