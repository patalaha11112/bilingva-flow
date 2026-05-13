'use client'

import { PenLine } from 'lucide-react'
import { TabPlaceholder } from '@/components/tab-placeholder'

export default function WritingPage() {
  return <TabPlaceholder icon={PenLine} titleKey="writing" gradient="bg-gradient-to-br from-emerald-500 to-green-500" />
}
