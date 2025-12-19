import React, { useState } from 'react';
import { Database, History, Brain, User, LogOut, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FloatingNav } from '@/components/ui/floating-navbar';

export const EnhancedPageHeader = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      name: 'Query Generator',
      link: '/',
      icon: <Database className="w-4 h-4" />,
      current: location.pathname === '/',
    },
    {
      name: 'Studio',
      link: '/studio',
      icon: <Brain className="w-4 h-4" />,
      current: location.pathname === '/studio',
    },
    {
      name: 'History',
      link: '/history',
      icon: <History className="w-4 h-4" />,
      current: location.pathname === '/history',
    },
  ];

  return (
    <>
      {/* Floating Navigation */}
      <FloatingNav navItems={navItems} />
      
      {/* Traditional Header - hidden on scroll when FloatingNav is visible */}
      <header className="bg-white shadow-sm">
        <div className="w-full px-0 py-1 relative" style={{ maxWidth: '100vw' }}>
          <div className="flex items-center justify-center relative min-h-[48px]">
            {/* Left: Logo and Title */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center pl-4">
              <Database className="h-6 w-6 text-purple-600" />
              <span className="ml-2 text-xl font-bold text-gray-800 whitespace-nowrap">
                Zeta Analytics
              </span>
            </div>
            
            {/* Center: Navigation Tabs (hidden on mobile) */}
            <div className="hidden sm:absolute sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:block">
              <nav className="flex bg-purple-50 rounded-full p-0.5 shadow-inner border border-purple-100">
                {navItems.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Link
                      key={tab.name}
                      to={tab.link}
                      className={cn(
                        'flex items-center justify-center gap-2 min-w-[160px] h-8 text-sm font-semibold transition-colors focus:outline-none',
                        'rounded-full',
                        tab.current
                          ? 'bg-gradient-to-r from-purple-500 to-blue-400 text-white shadow-md'
                          : 'text-purple-700 hover:bg-purple-100',
                      )}
                      style={{ zIndex: tab.current ? 2 : 1 }}
                    >
                      {Icon}
                      {tab.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            {/* Hamburger menu for mobile */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 sm:hidden">
              <button
                className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                onClick={() => setMobileMenuOpen((open) => !open)}
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6 text-purple-700" />
              </button>
              {mobileMenuOpen && (
                <div className="absolute left-1/2 top-10 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-purple-100 z-50 min-w-[160px] flex flex-col">
                  {navItems.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <Link
                        key={tab.name}
                        to={tab.link}
                        className={cn(
                          'flex items-center gap-2 px-4 py-3 text-base font-semibold transition-colors focus:outline-none',
                          tab.current
                            ? 'bg-gradient-to-r from-purple-500 to-blue-400 text-white'
                            : 'text-purple-700 hover:bg-purple-100',
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {Icon}
                        {tab.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Right: Account */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center pr-4 hidden sm:flex">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 bg-white border-2 border-gray-200 rounded-lg h-8 px-3 text-sm font-semibold shadow-sm text-black">
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
    </>
  );
};