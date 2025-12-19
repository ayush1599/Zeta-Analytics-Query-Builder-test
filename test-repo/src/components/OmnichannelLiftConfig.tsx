import React, { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface OmnichannelLiftConfigProps {
  onConfigChange: (config: any) => void;
}

export const OmnichannelLiftConfig = ({ onConfigChange }: OmnichannelLiftConfigProps) => {
  const [channel1, setChannel1] = useState<string>("");
  const [channel2, setChannel2] = useState<string>("");
  const [channel1Ids, setChannel1Ids] = useState<string>("");
  const [channel2Ids, setChannel2Ids] = useState<string>("");

  const updateConfig = useCallback(() => {
    const config = {
      channel1: { type: channel1, ids: channel1Ids },
      channel2: { type: channel2, ids: channel2Ids }
    };
    onConfigChange(config);
  }, [channel1, channel2, channel1Ids, channel2Ids, onConfigChange]);

  const handleChannel1Change = useCallback((value: string) => {
    setChannel1(value);
    if (value && value === channel2) {
      setChannel2("");
      setChannel2Ids("");
    }
  }, [channel2]);

  const handleChannel2Change = useCallback((value: string) => {
    setChannel2(value);
    if (value && value === channel1) {
      setChannel1("");
      setChannel1Ids("");
    }
  }, [channel1]);

  const handleChannel1IdsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setChannel1Ids(e.target.value);
  }, []);

  const handleChannel2IdsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setChannel2Ids(e.target.value);
  }, []);

  React.useEffect(() => {
    updateConfig();
  }, [updateConfig]);

  return (
    <div className="space-y-6">
      <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-3 block">
                Select First Channel
              </Label>
              <RadioGroup value={channel1} onValueChange={handleChannel1Change} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex-1 flex items-center p-[2px] bg-white rounded-lg">
                  <RadioGroupItem value="CTV" id="ctv1" disabled={channel2 === 'CTV'} />
                  <Label htmlFor="ctv1" className="w-full text-center cursor-pointer rounded-lg px-4 py-3 text-base font-semibold transition-all duration-200 ease-in-out bg-white text-gray-900 border-2 border-slate-200 shadow-sm hover:bg-slate-50 peer-data-[state=checked]:bg-gradient-to-r peer-data-[state=checked]:from-blue-500 peer-data-[state=checked]:to-purple-600 peer-data-[state=checked]:text-white peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:border-white peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">CTV</Label>
                </div>
                <div className="flex-1 flex items-center p-[2px] bg-white rounded-lg">
                  <RadioGroupItem value="Display" id="display1" disabled={channel2 === 'Display'} />
                  <Label htmlFor="display1" className="w-full text-center cursor-pointer rounded-lg px-4 py-3 text-base font-semibold transition-all duration-200 ease-in-out bg-white text-gray-900 border-2 border-slate-200 shadow-sm hover:bg-slate-50 peer-data-[state=checked]:bg-gradient-to-r peer-data-[state=checked]:from-blue-500 peer-data-[state=checked]:to-purple-600 peer-data-[state=checked]:text-white peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:border-white peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">Display</Label>
                </div>
                <div className="flex-1 flex items-center p-[2px] bg-white rounded-lg">
                  <RadioGroupItem value="OLV" id="olv1" disabled={channel2 === 'OLV'} />
                  <Label htmlFor="olv1" className="w-full text-center cursor-pointer rounded-lg px-4 py-3 text-base font-semibold transition-all duration-200 ease-in-out bg-white text-gray-900 border-2 border-slate-200 shadow-sm hover:bg-slate-50 peer-data-[state=checked]:bg-gradient-to-r peer-data-[state=checked]:from-blue-500 peer-data-[state=checked]:to-purple-600 peer-data-[state=checked]:text-white peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:border-white peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">OLV</Label>
                </div>
              </RadioGroup>
              {channel1 && (
                <div className="mt-4">
                  <Input
                    placeholder={`Enter ${channel1} Campaign/Line Item IDs (comma-separated)`}
                    value={channel1Ids}
                    onChange={handleChannel1IdsChange}
                    className="w-full rounded-xl border-slate-300/60 focus:border-green-500 focus:ring-green-500/20 bg-white"
                  />
                </div>
              )}
            </div>

            <div className="border-t border-slate-200/60 pt-6">
              <Label className="text-sm font-medium text-slate-700 mb-3 block">
                Select Second Channel
              </Label>
              <RadioGroup value={channel2} onValueChange={handleChannel2Change} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex-1 flex items-center p-[2px] bg-white rounded-lg">
                  <RadioGroupItem value="CTV" id="ctv2" disabled={channel1 === 'CTV'} />
                  <Label htmlFor="ctv2" className="w-full text-center cursor-pointer rounded-lg px-4 py-3 text-base font-semibold transition-all duration-200 ease-in-out bg-white text-gray-900 border-2 border-slate-200 shadow-sm hover:bg-slate-50 peer-data-[state=checked]:bg-gradient-to-r peer-data-[state=checked]:from-blue-500 peer-data-[state=checked]:to-purple-600 peer-data-[state=checked]:text-white peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:border-white peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">CTV</Label>
                </div>
                <div className="flex-1 flex items-center p-[2px] bg-white rounded-lg">
                  <RadioGroupItem value="Display" id="display2" disabled={channel1 === 'Display'} />
                  <Label htmlFor="display2" className="w-full text-center cursor-pointer rounded-lg px-4 py-3 text-base font-semibold transition-all duration-200 ease-in-out bg-white text-gray-900 border-2 border-slate-200 shadow-sm hover:bg-slate-50 peer-data-[state=checked]:bg-gradient-to-r peer-data-[state=checked]:from-blue-500 peer-data-[state=checked]:to-purple-600 peer-data-[state=checked]:text-white peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:border-white peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">Display</Label>
                </div>
                <div className="flex-1 flex items-center p-[2px] bg-white rounded-lg">
                  <RadioGroupItem value="OLV" id="olv2" disabled={channel1 === 'OLV'} />
                  <Label htmlFor="olv2" className="w-full text-center cursor-pointer rounded-lg px-4 py-3 text-base font-semibold transition-all duration-200 ease-in-out bg-white text-gray-900 border-2 border-slate-200 shadow-sm hover:bg-slate-50 peer-data-[state=checked]:bg-gradient-to-r peer-data-[state=checked]:from-blue-500 peer-data-[state=checked]:to-purple-600 peer-data-[state=checked]:text-white peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:border-white peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">OLV</Label>
                </div>
              </RadioGroup>
              {channel2 && (
                <div className="mt-4">
                  <Input
                    placeholder={`Enter ${channel2} Campaign/Line Item IDs (comma-separated)`}
                    value={channel2Ids}
                    onChange={handleChannel2IdsChange}
                    className="w-full rounded-xl border-slate-300/60 focus:border-green-500 focus:ring-green-500/20 bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
