'use client'

import { useState } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  AlertCircle,
  MessageSquare,
  FileText,
  Users,
  Clock,
  ExternalLink
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'case_update':
        return <FileText className="h-4 w-4 text-primary-600" />
      case 'message':
        return <MessageSquare className="h-4 w-4 text-green-600" />
      case 'community':
        return <Users className="h-4 w-4 text-primary-500" />
      case 'system':
        return <AlertCircle className="h-4 w-4 text-gold-600" />
      case 'reminder':
        return <Clock className="h-4 w-4 text-warning" />
      default:
        return <Bell className="h-4 w-4 text-ink-subtle" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-danger-tint text-danger border-danger-border'
      case 'high':
        return 'bg-warning-tint text-warning border-warning-border'
      case 'medium':
        return 'bg-info-tint text-info border-info-border'
      case 'low':
        return 'bg-surface-muted text-ink border-border'
      default:
        return 'bg-surface-muted text-ink border-border'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read
    return true
  })

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Stay updated with your reports and community activity
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
            >
              {filter === 'all' ? 'Show Unread' : 'Show All'}
            </Button>
            
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    notification.read 
                      ? 'bg-surface-muted border-border' 
                      : 'bg-white border-blue-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`text-sm font-medium ${
                          notification.read ? 'text-ink' : 'text-ink'
                        }`}>
                          {notification.title}
                        </h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(notification.priority)}`}
                        >
                          {notification.priority}
                        </Badge>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      
                      <p className={`text-sm ${
                        notification.read ? 'text-ink-muted' : 'text-ink'
                      }`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                        </span>
                        
                        <div className="flex gap-1">
                          {notification.actionUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => window.open(notification.actionUrl, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          )}
                          
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark Read
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-danger hover:text-danger"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
