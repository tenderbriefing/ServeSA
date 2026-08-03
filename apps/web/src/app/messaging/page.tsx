'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { MessageCenter } from '@/components/Messaging/MessageCenter'
import { DepartmentContacts } from '@/components/Messaging/DepartmentContacts'
import { MessageSquare, Building } from 'lucide-react'

export default function MessagingPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('messaging.loginRequired')}</h1>
          <p className="text-muted-foreground">{t('messaging.loginRequiredDescription')}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('messaging.title')}</h1>
        <p className="text-muted-foreground">{t('messaging.description')}</p>
      </div>

      <Tabs defaultValue="conversations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {t('messaging.conversations')}
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            {t('messaging.departments')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="space-y-4">
          <Card className="h-[600px]">
            <MessageCenter />
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card className="p-6">
            <DepartmentContacts onStartConversation={setSelectedConversation} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

