
import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const analysisOptions = [
  { value: "performance_report", label: "Performance Report" },
  { value: "dma", label: "DMA" },
  { value: "frequency_lag", label: "Frequency Lag (Requires Pixel ID)" },
  { value: "omnichannel_lift", label: "Omnichannel Lift" },
  { value: "path_to_click", label: "Path to Click" },
  { value: "path_to_conversion", label: "Path to Conversion (Requires Pixel ID)" },
  { value: "site_app", label: "Site & App" },
  { value: "devices", label: "Devices" },
  { value: "reach_frequency", label: "Reach & Frequency" },
  { value: "survey", label: "Survey (Requires Pixel ID)" },
  { value: "time_day_week", label: "Time of Day & Day of Week" },
  { value: "website_analysis", label: "Website Analysis (Requires Pixel ID)" },
  { value: "click_lag", label: "Click Lag" },
  { value: "prospect_retargeting", label: "Prospect to Retargeting" },
  { value: "audience_insights", label: "Audience Insights" },
  { value: "website_visitor_insights", label: "Website Visitor Audience Insights (Requires Pixel ID)" },
  { value: "audience_segments", label: "Audience Segments" },
  { value: "top_creatives", label: "Top Creatives" },
  { value: "top_genre", label: "Top Genre" },
  { value: "ctv_attributes", label: "CTV Attributes Fires (Requires Pixel ID)" },
];

interface AnalysisTypeSelectorProps {
  selectedTypes: string[];
  onSelectionChange: (types: string[]) => void;
}

export const AnalysisTypeSelector = ({ selectedTypes, onSelectionChange }: AnalysisTypeSelectorProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    if (selectedTypes.includes(value)) {
      onSelectionChange(selectedTypes.filter(type => type !== value));
    } else {
      onSelectionChange([...selectedTypes, value]);
    }
  };

  const removeType = (valueToRemove: string) => {
    onSelectionChange(selectedTypes.filter(type => type !== valueToRemove));
  };

  const selectedLabels = selectedTypes.map(value => 
    analysisOptions.find(option => option.value === value)?.label || value
  );

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] p-3 bg-white border-slate-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedTypes.length === 0 ? (
                <span className="text-slate-500">Select analysis types...</span>
              ) : (
                selectedLabels.map((label, index) => (
                  <Badge 
                    key={selectedTypes[index]} 
                    variant="secondary" 
                    className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    {label}
                    <button
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          removeType(selectedTypes[index]);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => removeType(selectedTypes[index])}
                    >
                      <X className="h-3 w-3 text-blue-600 hover:text-blue-800" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search analysis types..." className="h-9" />
            <CommandList>
              <CommandEmpty>No analysis type found.</CommandEmpty>
              <CommandGroup>
                {analysisOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <Checkbox
                      checked={selectedTypes.includes(option.value)}
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
      
      {selectedTypes.length > 0 && (
        <div className="text-xs text-slate-600">
          {selectedTypes.length} analysis type{selectedTypes.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
};
