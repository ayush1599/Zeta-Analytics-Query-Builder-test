import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Bot, ArrowRight, User, LogOut, Workflow } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import ZetaLogo from '../ZETA-logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BackgroundBeamsSimple } from '@/components/ui/background-beams-simple';



const Homepage = () => {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleGetStarted = () => {
    if (selectedOption === "query-generator") {
      navigate("/query-generator");
    } else if (selectedOption === "studio") {
      navigate("/studio");
    } else if (selectedOption === "zigs-data-transfer") {
      navigate("/zigs-data-transfer");
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/8 to-blue-800/6"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/4 via-blue-400/3 to-purple-700/5"></div>
      
      {/* Background Beams Effect */}
      <BackgroundBeamsSimple />
      
      
      {/* Content */}
      <div className="relative z-20 min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="w-full px-0 py-1 relative" style={{ maxWidth: '100vw' }}>
          <div className="flex items-center justify-center relative min-h-[48px]">
            {/* Left: Logo and Title */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center pl-4">
              <img src={ZetaLogo} alt="Zeta Logo" className="h-6 w-6 object-contain" />
              <span className="ml-2 text-xl font-bold text-gray-800 whitespace-nowrap">
                Zeta Analytics
              </span>
            </div>
            {/* Right: Account */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center pr-4 hidden sm:flex">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 bg-white border-2 border-gray-200 rounded-lg h-8 px-3 text-sm font-semibold shadow-sm" style={{ color: '#352f36' }}>
                      <User className="h-4 w-4" />
                      <span className="truncate max-w-[140px]">{user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <div className="max-w-2xl w-full text-center">
          {/* Welcome Section */}
          <div className="mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: '#352f36' }}>
              Welcome to{' '}
              <span className="bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 bg-[length:200%_100%] bg-clip-text text-transparent animate-gradient-x">
                Analytics Studio
              </span>
            </h2>

          </div>

          {/* Selection Card */}
          <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-xl">
            <CardContent className="p-8 sm:p-12">
              <div className="space-y-8">
                <div>
                  <Select value={selectedOption} onValueChange={setSelectedOption}>
                    <SelectTrigger className="group w-full h-16 text-lg bg-white/80 backdrop-blur-sm border-2 border-gray-200/60 hover:border-gray-300/80 focus:border-purple-400 focus:ring-4 focus:ring-purple-100/50 transition-all duration-300 ease-out shadow-lg hover:shadow-xl rounded-2xl overflow-hidden relative">
                      {/* Light Grey Hover Effect */}
                      <div className="absolute inset-0 bg-gray-100/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out rounded-2xl"></div>
                      
                      {selectedOption ? (
                        <div className="flex items-center gap-4 w-full relative z-10">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-400 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                            {selectedOption === "query-generator" ? (
                              <Database className="w-5 h-5 text-white" />
                            ) : selectedOption === "studio" ? (
                              <Bot className="w-5 h-5 text-white" />
                            ) : (
                              <Workflow className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="text-left">
                            <span className="font-bold text-gray-900 text-lg">
                              {selectedOption === "query-generator" ? "Query Generator" : 
                               selectedOption === "studio" ? "Studio" : "ZIGS & Data Transfer"}
                            </span>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {selectedOption === "query-generator" ? "Automated SQL generation" : 
                               selectedOption === "studio" ? "Natural Language report builder" : 
                               "ZIGS and Data Transfer operations"}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full relative z-10">
                          <span className="text-gray-500 font-medium">Select your tool...</span>
                        </div>
                      )}
                    </SelectTrigger>
                    
                                          <SelectContent className="homepage-select min-w-full mt-2 bg-white/95 backdrop-blur-md border border-gray-200/60 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200 [&>div[data-radix-select-item-indicator]]:hidden [&_span[data-radix-select-item-indicator]]:hidden [&_div[data-radix-select-item-indicator]]:hidden">
                        <SelectItem value="query-generator" className="cursor-pointer group/item p-4 hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-purple-100/70 hover:to-blue-50/90 data-[highlighted]:bg-gradient-to-r data-[highlighted]:from-purple-50/90 data-[highlighted]:via-purple-100/70 data-[highlighted]:to-blue-50/90 transition-all duration-300 ease-out border-b border-gray-100/50 last:border-b-0 hover:shadow-md hover:scale-[1.02] [&>span[data-radix-select-item-indicator]]:hidden [&_span[data-radix-select-item-indicator]]:hidden [&_div[data-radix-select-item-indicator]]:hidden">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-blue-400 flex items-center justify-center flex-shrink-0 shadow-lg group-hover/item:scale-110 transition-transform duration-200">
                            <Database className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-left flex-1">
                            <div className="font-bold text-gray-900 text-base">Query Generator</div>
                            <div className="text-xs text-gray-600 mt-1">Automated SQL generation</div>
                          </div>
                        </div>
                                              </SelectItem>
                        
                        <SelectItem value="studio" className="cursor-pointer group/item p-4 hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-purple-100/70 hover:to-blue-50/90 data-[highlighted]:bg-gradient-to-r data-[highlighted]:from-purple-50/90 data-[highlighted]:via-purple-100/70 data-[highlighted]:to-blue-50/90 transition-all duration-300 ease-out hover:shadow-md hover:scale-[1.02] [&>span[data-radix-select-item-indicator]]:hidden [&_span[data-radix-select-item-indicator]]:hidden [&_div[data-radix-select-item-indicator]]:hidden">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-blue-400 flex items-center justify-center flex-shrink-0 shadow-lg group-hover/item:scale-110 transition-transform duration-200">
                              <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left flex-1">
                              <div className="font-bold text-gray-900 text-base">Studio</div>
                              <div className="text-xs text-gray-600 mt-1">Natural Language report builder</div>
                            </div>
                          </div>
                        </SelectItem>
                        
                        <SelectItem value="zigs-data-transfer" className="cursor-pointer group/item p-4 hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-purple-100/70 hover:to-blue-50/90 data-[highlighted]:bg-gradient-to-r data-[highlighted]:from-purple-50/90 data-[highlighted]:via-purple-100/70 data-[highlighted]:to-blue-50/90 transition-all duration-300 ease-out hover:shadow-md hover:scale-[1.02] [&>span[data-radix-select-item-indicator]]:hidden [&_span[data-radix-select-item-indicator]]:hidden [&_div[data-radix-select-item-indicator]]:hidden">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-blue-400 flex items-center justify-center flex-shrink-0 shadow-lg group-hover/item:scale-110 transition-transform duration-200">
                              <Workflow className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left flex-1">
                              <div className="font-bold text-gray-900 text-base">ZIGS & Data Transfer</div>
                              <div className="text-xs text-gray-600 mt-1">ZIGS and Data Transfer operations</div>
                            </div>
                          </div>
                        </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Feature Comparison */}
                {selectedOption && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-purple-200/50">
                    {selectedOption === "query-generator" && (
                      <div className="text-left space-y-3">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Database className="w-5 h-5 text-purple-600" />
                          Query Generator Features
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-700">
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                            Form-based interface for structured query building
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                            Query history and saved queries management
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                            Analysis type selection and configuration
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                            Date range and granularity controls
                          </li>
                        </ul>
                      </div>
                    )}
                    
                    {selectedOption === "studio" && (
                      <div className="text-left space-y-3">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Bot className="w-5 h-5 text-purple-600" />
                          Studio Features
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-700">
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                            Natural language query generation
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                            Conversational AI interface
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                            Analyst and Account Manager modes
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                            Smart date parsing and template matching
                          </li>
                        </ul>
                      </div>
                    )}
                    
                    {selectedOption === "zigs-data-transfer" && (
                      <div className="text-left space-y-3">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Workflow className="w-5 h-5 text-purple-600" />
                          ZIGS & Data Transfer Features
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-700">
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                            ZIGS and Data Transfer operations
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleGetStarted}
                  disabled={!selectedOption}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-500 to-blue-400 hover:from-purple-600 hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      </div>
    </div>
  );
};

export default Homepage;