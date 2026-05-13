'use client'

import { Play } from 'lucide-react'
import { TabPlaceholder } from '@/components/tab-placeholder'

export default function VideoPage() {
  return <TabPlaceholder icon={Play} titleKey="video" gradient="bg-gradient-to-br from-orange-500 to-red-500" />
}
