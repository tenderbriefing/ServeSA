'use client'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Building, MessageSquare, Phone, Mail, Clock, Users, Search } from 'lucide-react'

interface Department {
  id: string
  name: string
  description: string
  category: string
  contactEmail: string
  contactPhone: string
  operatingHours: string
  staffCount: number
  responseTime: string
  isOnline: boolean
}

interface DepartmentContactProps {
  onStartConversation: (departmentId: string) => void
}

export function DepartmentContacts({ onStartConversation }: DepartmentContactProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [departments, setDepartments] = useState<Department[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  // Load departments from Firestore
  useEffect(() => {
    const loadDepartments = async () => {
      setIsLoading(true)
      try {
        const departmentsQuery = query(collection(db, 'departments'))
        const unsubscribe = onSnapshot(departmentsQuery, (snapshot) => {
          const departmentsData: Department[] = []
          
          snapshot.docs.forEach((docSnapshot) => {
            const data = docSnapshot.data()
            departmentsData.push({
              id: docSnapshot.id,
              name: data.name,
              description: data.description,
              category: data.category,
              contactEmail: data.contactEmail,
              contactPhone: data.contactPhone,
              operatingHours: data.operatingHours || data.workingHours || 'Mon-Fri 8AM-5PM',
              staffCount: data.staffCount || 0,
              responseTime: data.responseTime || '24-48 hours',
              isOnline: data.isOnline || false,
            })
          })
          
          setDepartments(departmentsData)
        })

        return () => unsubscribe()
      } catch (error) {
        console.error('Error loading departments:', error)
        // Fallback to default departments if Firestore fails
        const defaultDepartments: Department[] = [
          {
            id: 'dept-1',
            name: 'Water & Sanitation',
            description: 'Responsible for water supply, sewage, and sanitation services',
            category: 'utilities',
            contactEmail: 'water@municipality.gov.za',
            contactPhone: '+27 11 123 4567',
            operatingHours: 'Mon-Fri 8:00-17:00',
            staffCount: 45,
            responseTime: '24-48 hours',
            isOnline: true
          },
          {
            id: 'dept-2',
            name: 'Roads & Transport',
            description: 'Maintenance and development of roads, traffic management',
            category: 'infrastructure',
            contactEmail: 'roads@municipality.gov.za',
            contactPhone: '+27 11 123 4568',
            operatingHours: 'Mon-Fri 7:00-18:00',
            staffCount: 32,
            responseTime: '48-72 hours',
            isOnline: true
          },
          {
            id: 'dept-3',
            name: 'Electricity',
            description: 'Power supply, street lighting, and electrical infrastructure',
            category: 'utilities',
            contactEmail: 'electricity@municipality.gov.za',
            contactPhone: '+27 11 123 4569',
            operatingHours: '24/7 Emergency Service',
            staffCount: 28,
            responseTime: '2-4 hours (emergency)',
            isOnline: true
          }
        ]
        setDepartments(defaultDepartments)
      } finally {
        setIsLoading(false)
      }
    }

    loadDepartments()
  }, [])

  const handleStartConversation = async (department: Department) => {
    if (!user) return

    setIsLoading(true)
    try {
      // Create a new conversation
      const conversationRef = await addDoc(collection(db, 'conversations'), {
        participants: [user.uid, department.id],
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        unreadCount: {},
        createdAt: serverTimestamp()
      })

      onStartConversation(conversationRef.id)
    } catch (error) {
      console.error('Error starting conversation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredDepartments = departments.filter(department => {
    const matchesSearch = department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         department.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || department.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = [
    { value: 'all', label: t('messaging.allCategories') },
    { value: 'utilities', label: t('messaging.utilities') },
    { value: 'infrastructure', label: t('messaging.infrastructure') },
    { value: 'environment', label: t('messaging.environment') },
    { value: 'community', label: t('messaging.community') },
    { value: 'development', label: t('messaging.development') }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('messaging.departmentContacts')}</h2>
          <p className="text-muted-foreground">{t('messaging.departmentContactsDescription')}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('messaging.searchDepartments')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((department) => (
          <Card key={department.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{department.name}</CardTitle>
                    <Badge variant={department.isOnline ? 'default' : 'secondary'} className="mt-1">
                      {department.isOnline ? t('messaging.online') : t('messaging.offline')}
                    </Badge>
                  </div>
                </div>
              </div>
              <CardDescription>{department.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{department.contactEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{department.contactPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{department.operatingHours}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{t('messaging.staffCount', { count: department.staffCount })}</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground mb-2">
                  {t('messaging.typicalResponseTime')}: {department.responseTime}
                </div>
                <Button
                  onClick={() => handleStartConversation(department)}
                  disabled={isLoading || !department.isOnline}
                  className="w-full"
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {department.isOnline ? t('messaging.startChat') : t('messaging.offline')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDepartments.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t('messaging.noDepartmentsFound')}</p>
        </div>
      )}
    </div>
  )
}

