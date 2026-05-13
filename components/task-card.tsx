"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

interface TaskCardProps {
  title: string
  description: string
  completed: boolean
  color: "blue" | "green" | "orange"
  href?: string
  onOpen: () => void
  className?: string
}

const colorMap = {
  blue: "bg-ring-blue/10 text-ring-blue border-ring-blue/20",
  green: "bg-ring-green/10 text-ring-green border-ring-green/20",
  orange: "bg-ring-orange/10 text-ring-orange border-ring-orange/20",
}

const dotColorMap = {
  blue: "bg-ring-blue",
  green: "bg-ring-green", 
  orange: "bg-ring-orange",
}

export function TaskCard({ 
  title, 
  description, 
  completed, 
  color, 
  href,
  onOpen,
  className 
}: TaskCardProps) {
  return (
    <Card className={cn(
      "border bg-card transition-all duration-200",
      completed && "opacity-60",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn(
              "mt-1 h-3 w-3 rounded-full shrink-0",
              dotColorMap[color]
            )} />
            <div className="space-y-1">
              <p className="font-medium leading-tight">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          {completed ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <Check className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : href ? (
            <Button 
              size="sm" 
              variant="secondary"
              className="shrink-0"
              asChild
            >
              <Link href={href} onClick={onOpen}>Open</Link>
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="secondary"
              onClick={onOpen}
              className="shrink-0"
            >
              Open
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
