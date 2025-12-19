import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { PageFooter } from "@/components/PageFooter";
import { ConversationalAI } from "@/components/ConversationalAI";
import { ArrowLeft, Code, FileText } from "lucide-react";
import { cn } from '@/lib/utils';

type UserMode = 'analyst' | 'account_manager';

const Studio = () => {
  const navigate = useNavigate();
  const [userMode, setUserMode] = useState<UserMode>('analyst');

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 flex flex-col overflow-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
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
            {/* Center: Mode Toggle */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex items-center gap-0 bg-purple-50 rounded-full p-0.5 shadow-inner border border-purple-100">
                <button
                  onClick={() => setUserMode('analyst')}
                  className={cn(
                    'flex items-center justify-center gap-2 min-w-[160px] h-8 text-sm font-semibold transition-colors focus:outline-none',
                    'rounded-full',
                    userMode === 'analyst'
                      ? 'bg-gradient-to-r from-purple-500 to-blue-400 text-white shadow-md'
                      : 'text-purple-700 hover:bg-purple-100',
                  )}
                  style={{ zIndex: userMode === 'analyst' ? 2 : 1 }}
                >
                  <Code className="w-4 h-4" />
                  Analyst
                </button>
                <button
                  onClick={() => setUserMode('account_manager')}
                  className={cn(
                    'flex items-center justify-center gap-2 min-w-[160px] h-8 text-sm font-semibold transition-colors focus:outline-none',
                    'rounded-full',
                    userMode === 'account_manager'
                      ? 'bg-gradient-to-r from-purple-500 to-blue-400 text-white shadow-md'
                      : 'text-purple-700 hover:bg-purple-100',
                  )}
                  style={{ zIndex: userMode === 'account_manager' ? 2 : 1 }}
                >
                  <FileText className="w-4 h-4" />
                  Account Manager
                </button>
              </div>
            </div>
            {/* Right: Spacer */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center pr-4">
              <div className="w-24"></div> {/* Spacer for centering */}
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 px-4 sm:px-6 py-4 flex flex-col min-h-0 max-w-none">
        <div className="flex-1 min-h-0 max-w-7xl mx-auto w-full">
          <ConversationalAI userMode={userMode} setUserMode={setUserMode} />
        </div>
      </main>
      <div className="flex-shrink-0">
        <PageFooter />
      </div>
    </div>
  );
};

export default Studio;
