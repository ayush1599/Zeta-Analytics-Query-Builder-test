"use client";
import React, { useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: {
    name: string;
    link: string;
    icon?: JSX.Element;
    current?: boolean;
  }[];
  className?: string;
}) => {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    if (typeof current === "number") {
      let direction = current! - scrollYProgress.getPrevious()!;

      if (scrollYProgress.get() < 0.05) {
        setVisible(false);
      } else {
        if (direction < 0) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      }
    }
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 1,
          y: -100,
        }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className={cn(
          // Base floating nav styles adapted to your design system
          "flex max-w-fit fixed top-4 inset-x-0 mx-auto z-[5000] px-4 py-2",
          "bg-white/95 backdrop-blur-md border border-gray-200/60 rounded-2xl",
          "shadow-lg hover:shadow-xl transition-all duration-300",
          className
        )}
      >
        {navItems.map((navItem, idx) => (
          <Link
            key={`link-${idx}`}
            to={navItem.link}
            className={cn(
              // Navigation item styles matching your design system
              "relative flex items-center justify-center gap-2 min-w-[120px] h-10 text-sm font-semibold",
              "transition-colors focus:outline-none rounded-full px-4 py-2 mx-1",
              navItem.current
                ? "bg-gradient-to-r from-purple-500 to-blue-400 text-white shadow-md"
                : "text-purple-700 hover:bg-purple-100/80"
            )}
          >
            <span className="relative z-20 flex items-center gap-2">
              {navItem.icon && (
                <div className="w-4 h-4 flex items-center justify-center">
                  {navItem.icon}
                </div>
              )}
              {navItem.name}
            </span>
            {navItem.current && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-400 rounded-full"
                style={{ zIndex: -1 }}
                initial={false}
                transition={{
                  type: "spring",
                  bounce: 0.2,
                  duration: 0.6,
                }}
              />
            )}
          </Link>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};