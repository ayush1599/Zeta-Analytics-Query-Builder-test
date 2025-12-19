import React from 'react';
import { cn } from '@/lib/utils';
import { designTokens, componentClasses } from '@/lib/design-tokens';
import { Button } from './button';
import { Card, CardContent } from './card';

/**
 * Base components that match your existing design system
 * Use these instead of creating custom styles to ensure consistency
 */

// Primary Button - matches your main action buttons
interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
}

export const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ children, className, loading, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(componentClasses.primaryButton, className)}
        disabled={loading || props.disabled}
        {...props}
      >
        {children}
        {loading && <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
      </Button>
    );
  }
);

// Secondary Button - matches your back buttons
interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const SecondaryButton = React.forwardRef<HTMLButtonElement, SecondaryButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(componentClasses.secondaryButton, className)}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

// Workflow Card - matches your ZIGS workflow cards
interface WorkflowCardProps {
  children: React.ReactNode;
  className?: string;
}

export const WorkflowCard = ({ children, className }: WorkflowCardProps) => {
  return (
    <Card className={cn(componentClasses.workflowCard, className)}>
      <CardContent className={designTokens.spacing.cardPadding}>
        {children}
      </CardContent>
    </Card>
  );
};

// Icon Box - matches your source/operation/destination icons
interface IconBoxProps {
  variant: 'blue' | 'purple' | 'green';
  icon: React.ReactNode;
  className?: string;
}

export const IconBox = ({ variant, icon, className }: IconBoxProps) => {
  return (
    <div className={cn(componentClasses.iconBox[variant], className)}>
      {icon}
    </div>
  );
};

// Section Title - matches your page/section titles
interface SectionTitleProps {
  children: React.ReactNode;
  gradient?: boolean;
  className?: string;
}

export const SectionTitle = ({ children, gradient = false, className }: SectionTitleProps) => {
  return (
    <h2 className={cn(
      designTokens.text.pageTitle,
      gradient && designTokens.gradients.textPrimary,
      className
    )}>
      {children}
    </h2>
  );
};

// Feature List - matches your feature bullet points
interface FeatureListProps {
  items: string[];
  className?: string;
}

export const FeatureList = ({ items, className }: FeatureListProps) => {
  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <li key={index} className={componentClasses.featureListItem}>
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0"></div>
          {item}
        </li>
      ))}
    </ul>
  );
};

// Page Header - matches your consistent header pattern
interface PageHeaderProps {
  title: string;
  backButton?: {
    onClick: () => void;
    label?: string;
  };
  rightContent?: React.ReactNode;
}

export const PageHeader = ({ title, backButton, rightContent }: PageHeaderProps) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="w-full px-0 py-1 relative" style={{ maxWidth: '100vw' }}>
        <div className="flex items-center justify-center relative min-h-[48px]">
          {/* Left: Back Button */}
          {backButton && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center pl-4">
              <SecondaryButton onClick={backButton.onClick}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-400 flex items-center justify-center shadow-md">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                  <span>{backButton.label || "Back to Home"}</span>
                </div>
              </SecondaryButton>
            </div>
          )}
          
          {/* Center: Title */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-xl font-bold text-gray-800 whitespace-nowrap">
              {title}
            </h1>
          </div>
          
          {/* Right: Additional Content */}
          {rightContent && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center pr-4">
              {rightContent}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Connection Line - matches your workflow connection lines
interface ConnectionLineProps {
  active?: boolean;
  className?: string;
}

export const ConnectionLine = ({ active = false, className }: ConnectionLineProps) => {
  return (
    <div className={cn("relative flex items-center justify-center mx-4", className)}>
      <div className={cn(
        "w-32 h-2 transition-all duration-700 rounded-full relative overflow-hidden",
        active ? 
          "bg-gradient-to-r from-purple-400 to-blue-400" : 
          "bg-gradient-to-r from-gray-300 to-gray-400"
      )}>
        {active && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full animate-flow"></div>
        )}
      </div>
    </div>
  );
};

// Status Indicator - matches your pulsating dots
interface StatusIndicatorProps {
  active?: boolean;
  variant?: 'blue' | 'purple' | 'green';
  className?: string;
}

export const StatusIndicator = ({ active = false, variant = 'blue', className }: StatusIndicatorProps) => {
  const colors = {
    blue: active ? "bg-blue-400 shadow-lg shadow-blue-400/50 animate-pulse" : "bg-blue-300",
    purple: active ? "bg-purple-400 shadow-lg shadow-purple-400/50 animate-pulse" : "bg-purple-300",
    green: active ? "bg-green-400 shadow-lg shadow-green-400/50 animate-pulse" : "bg-green-300",
  };

  return (
    <div className={cn(
      "w-3 h-3 rounded-full mx-auto transition-all duration-700",
      colors[variant],
      className
    )} />
  );
};