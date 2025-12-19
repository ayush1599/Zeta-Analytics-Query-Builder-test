"use client";
import React from "react";
import { motion } from "motion/react";

export default function ColourfulText({ text }: { text: string }) {
  const colors = [
    "rgb(147, 51, 234)",  // purple-600
    "rgb(124, 58, 237)",  // violet-600
    "rgb(99, 102, 241)",  // indigo-500
    "rgb(59, 130, 246)",  // blue-500
    "rgb(168, 85, 247)",  // purple-500
    "rgb(139, 92, 246)",  // violet-500
    "rgb(79, 70, 229)",   // indigo-600
    "rgb(37, 99, 235)",   // blue-600
    "rgb(147, 51, 234)",  // purple-600
    "rgb(59, 130, 246)",  // blue-500
  ];

  const [currentColors, setCurrentColors] = React.useState(colors);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const shuffled = [...colors].sort(() => Math.random() - 0.5);
      setCurrentColors(shuffled);
      setCount((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return text.split("").map((char, index) => (
    <motion.span
      key={`${char}-${count}-${index}`}
      initial={{
        y: 0,
      }}
      animate={{
        color: currentColors[index % currentColors.length],
        y: [0, -3, 0],
        scale: [1, 1.01, 1],
        filter: ["blur(0px)", `blur(5px)`, "blur(0px)"],
        opacity: [1, 0.8, 1],
      }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
      }}
      className="inline-block whitespace-pre font-sans tracking-tight"
    >
      {char}
    </motion.span>
  ));
}
