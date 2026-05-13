"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
  icon: React.ReactNode
  value: number
  label: string
  className?: string
}

export function StatCard({ icon, value, label, className }: StatCardProps) {
  return (
    <Card className={cn("border-0 bg-card shadow-sm", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            {icon}
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
