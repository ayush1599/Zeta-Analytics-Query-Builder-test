"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center bg-white text-slate-950",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            `after:animate-aurora pointer-events-none absolute -inset-[10px] opacity-50 blur-[10px] invert filter after:absolute after:-inset-[20px] after:mix-blend-difference after:content-[''] after:[background-attachment:fixed] after:[background-image:--aurora] after:[background-size:300%,_200%,_100%] after:[background-position:50%_50%,_50%_50%,_50%_50%] after:[background-repeat:no-repeat] after:dark:invert-0 after:invert`,
            "after:[background-image:repeating-linear-gradient(100deg,#a855f7_10%,#3b82f6_15%,#8b5cf6_20%,#6366f1_25%,#a855f7_30%)]"
          )}
        ></div>
      </div>
      {showRadialGradient && (
        <div className="absolute inset-0 bg-gradient-radial from-purple-100/20 via-transparent to-transparent"></div>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};