import React from "react";

interface PumpItLogoProps {
  className?: string;
  size?: number;
}

export function PumpItLogo({ className = "w-5 h-5", size = 20 }: PumpItLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Triangle Outline (smooth rounded corners) */}
      <path
        d="M 12 3.5 L 20 19.5 L 4 19.5 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Left Half: Solid Fill */}
      <path
        d="M 12 3.5 L 4 19.5 L 12 19.5 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Center Dividing Line */}
      <path
        d="M 12 3.5 L 12 19.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
