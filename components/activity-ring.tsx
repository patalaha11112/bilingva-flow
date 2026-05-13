"use client"

import { cn } from "@/lib/utils"

interface ActivityRingProps {
  sentence: boolean
  writing: boolean
  video: boolean
  size?: number
  className?: string
  glowing?: boolean
}

export function ActivityRing({ 
  sentence, 
  writing, 
  video, 
  size = 48, 
  className,
  glowing = false
}: ActivityRingProps) {
  const strokeWidth = size * 0.12
  const center = size / 2
  
  // Three concentric rings
  const outerRadius = (size - strokeWidth) / 2
  const middleRadius = outerRadius - strokeWidth - 2
  const innerRadius = middleRadius - strokeWidth - 2
  
  const circumference = (radius: number) => 2 * Math.PI * radius
  
  const allComplete = sentence && writing && video
  
  return (
    <div className={cn("relative", className)}>
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        className={cn(
          "transform -rotate-90 transition-all duration-500",
          allComplete && glowing && "drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
        )}
      >
        {/* Background rings */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/50"
        />
        <circle
          cx={center}
          cy={center}
          r={middleRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/50"
        />
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/50"
        />
        
        {/* Active rings */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke="var(--ring-blue)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference(outerRadius)}
          strokeDashoffset={sentence ? 0 : circumference(outerRadius)}
          className="transition-all duration-700 ease-out"
        />
        <circle
          cx={center}
          cy={center}
          r={middleRadius}
          fill="none"
          stroke="var(--ring-green)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference(middleRadius)}
          strokeDashoffset={writing ? 0 : circumference(middleRadius)}
          className="transition-all duration-700 ease-out delay-100"
        />
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke="var(--ring-orange)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference(innerRadius)}
          strokeDashoffset={video ? 0 : circumference(innerRadius)}
          className="transition-all duration-700 ease-out delay-200"
        />
      </svg>
      
      {allComplete && glowing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs animate-pulse">✨</span>
        </div>
      )}
    </div>
  )
}
