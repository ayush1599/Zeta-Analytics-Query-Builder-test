import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const granularityOptions = [
  { value: "Campaign", label: "Campaign" },
  { value: "Line_Item", label: "Line Item" },
  { value: "Tactic", label: "Tactic" },
];

interface GranularitySelectorProps {
  selectedGranularity: string;
  onSelectionChange: (granularity: string) => void;
}

export const GranularitySelector = ({ selectedGranularity, onSelectionChange }: GranularitySelectorProps) => {
  return (
    <RadioGroup 
      value={selectedGranularity} 
      onValueChange={onSelectionChange}
      className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
    >
      {granularityOptions.map((option) => (
        <div key={option.value} className="flex-1 flex items-center p-[2px] bg-white rounded-lg">
          <RadioGroupItem value={option.value} id={`granularity-${option.value}`} />
          <Label 
            htmlFor={`granularity-${option.value}`}
            className="w-full text-center cursor-pointer rounded-lg px-4 py-3 text-base font-semibold transition-all duration-200 ease-in-out bg-white text-gray-900 border-2 border-slate-200 shadow-sm hover:bg-slate-50 peer-data-[state=checked]:bg-gradient-to-r peer-data-[state=checked]:from-blue-500 peer-data-[state=checked]:to-purple-600 peer-data-[state=checked]:text-white peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:border-white"
          >
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};
