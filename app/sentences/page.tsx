'use client'

import { MessageSquareText } from 'lucide-react'
import { TabPlaceholder } from '@/components/tab-placeholder'

export default function SentencesPage() {
  return <TabPlaceholder icon={MessageSquareText} titleKey="sentences" gradient="bg-gradient-to-br from-violet-500 to-purple-500" />
}
