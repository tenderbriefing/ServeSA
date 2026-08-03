'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  Droplets, 
  Zap, 
  Car, 
  Trash2, 
  Wifi, 
  Phone, 
  Building, 
  Trees,
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react'

const serviceCategories = [
  {
    id: 'water',
    name: 'Water & Sewage',
    description: 'Report water leaks, pipe bursts, and sewage issues',
    icon: Droplets,
    color: 'bg-blue-100 text-blue-600',
    count: 1247,
    sla: '24h'
  },
  {
    id: 'electricity',
    name: 'Electricity',
    description: 'Power outages, street lights, and electrical hazards',
    icon: Zap,
    color: 'bg-yellow-100 text-yellow-600',
    count: 892,
    sla: '4h'
  },
  {
    id: 'roads',
    name: 'Roads & Infrastructure',
    description: 'Potholes, road damage, and traffic signals',
    icon: Car,
    color: 'bg-gray-100 text-gray-600',
    count: 2156,
    sla: '72h'
  },
  {
    id: 'waste',
    name: 'Waste Management',
    description: 'Garbage collection, illegal dumping, and recycling',
    icon: Trash2,
    color: 'bg-green-100 text-green-600',
    count: 634,
    sla: '48h'
  },
  {
    id: 'internet',
    name: 'Digital Services',
    description: 'WiFi hotspots, digital kiosks, and connectivity',
    icon: Wifi,
    color: 'bg-purple-100 text-purple-600',
    count: 156,
    sla: '168h'
  },
  {
    id: 'emergency',
    name: 'Emergency Services',
    description: 'Urgent safety issues and emergency response',
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-600',
    count: 89,
    sla: '1h'
  }
]

export function ServiceGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {serviceCategories.map((service) => {
        const IconComponent = service.icon
        return (
          <Link key={service.id} href={`/report?category=${service.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${service.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {service.sla}
                  </Badge>
                </div>
                <CardTitle className="text-lg group-hover:text-primary-600 transition-colors">
                  {service.name}
                </CardTitle>
                <CardDescription className="text-sm">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{service.count.toLocaleString()} reports</span>
                  <MoreHorizontal className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
