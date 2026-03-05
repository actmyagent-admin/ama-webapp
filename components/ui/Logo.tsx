"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface LogoProps {
  height?: number;
  width?: number;
  className?: string;
}

export function Logo({ height = 36, width = 70, className = "" }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ height, width }} />;
  return (
    <Image
      src="/images/act-my-agent-logo.svg"
      alt="ActMyAgent"
      height={height}
      width={width}
      className={`object-contain ${resolvedTheme === "dark" ? "brightness-0 invert" : ""} ${className}`}
      priority
    />
  );
}
