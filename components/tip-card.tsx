"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Lightbulb } from "lucide-react"

interface TipCardProps {
  tip: string
}

export function TipCard({ tip }: TipCardProps) {
  return (
    <Card className="border-0 bg-muted/50">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ring-orange/10">
            <Lightbulb className="h-4 w-4 text-ring-orange" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tip of the day
            </p>
            <p className="text-sm leading-relaxed">{tip}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
