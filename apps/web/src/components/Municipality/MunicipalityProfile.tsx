'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getMunicipalityProfile, type MunicipalityProfile } from '@/lib/municipalityProfiles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { 
  MapPin, 
  Users, 
  Calendar, 
  Phone, 
  Mail, 
  Globe, 
  Facebook, 
  Twitter, 
  Instagram,
  Lightbulb,
  Landmark,
  Wrench,
  Newspaper,
  Star,
  ExternalLink
} from 'lucide-react'

export function MunicipalityProfile() {
  const { user, userProfile } = useAuth()
  const [municipalityProfile, setMunicipalityProfile] = useState<MunicipalityProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userProfile?.municipalityCode) {
      const profile = getMunicipalityProfile(userProfile.municipalityCode)
      setMunicipalityProfile(profile)
    }
    setLoading(false)
  }, [userProfile])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!municipalityProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Municipality Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please complete your profile with your municipality information to see local facts and services.
          </p>
        </CardContent>
      </Card>
    )
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Metropolitan': return 'bg-blue-100 text-blue-800'
      case 'District': return 'bg-green-100 text-green-800'
      case 'Local': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <MapPin className="h-6 w-6 text-blue-500" />
                {municipalityProfile.name}
              </CardTitle>
              <CardDescription className="mt-2">
                Welcome to your local municipality! Here's what makes {municipalityProfile.name} special.
              </CardDescription>
            </div>
            <Badge className={getTypeColor(municipalityProfile.type)}>
              {municipalityProfile.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {municipalityProfile.population && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Population:</strong> {municipalityProfile.population}
                </span>
              </div>
            )}
            {municipalityProfile.area && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Area:</strong> {municipalityProfile.area}
                </span>
              </div>
            )}
            {municipalityProfile.established && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Established:</strong> {municipalityProfile.established}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Content */}
      <Tabs defaultValue="fun-facts" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="fun-facts">Fun Facts</TabsTrigger>
          <TabsTrigger value="landmarks">Landmarks</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="fun-facts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Did You Know?
              </CardTitle>
              <CardDescription>
                Interesting facts about {municipalityProfile.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {municipalityProfile.funFacts.map((fact, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{fact}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="landmarks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-purple-500" />
                Local Landmarks & Attractions
              </CardTitle>
              <CardDescription>
                Must-visit places in {municipalityProfile.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {municipalityProfile.landmarks.map((landmark, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <MapPin className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    <span className="text-sm font-medium">{landmark}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-green-500" />
                Municipal Services
              </CardTitle>
              <CardDescription>
                Services provided by {municipalityProfile.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {municipalityProfile.localServices.map((service, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Wrench className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm font-medium">{service}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-blue-500" />
                Local News & Events
              </CardTitle>
              <CardDescription>
                Stay updated with what's happening in {municipalityProfile.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {municipalityProfile.localNews && municipalityProfile.localNews.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-blue-700">Latest News</h4>
                    <div className="space-y-2">
                      {municipalityProfile.localNews.map((news, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <Newspaper className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{news}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {municipalityProfile.upcomingEvents && municipalityProfile.upcomingEvents.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-green-700">Upcoming Events</h4>
                    <div className="space-y-2">
                      {municipalityProfile.upcomingEvents.map((event, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                          <Calendar className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{event}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-orange-500" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Get in touch with {municipalityProfile.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {municipalityProfile.contactInfo.phone && (
                    <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <Phone className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-gray-600">{municipalityProfile.contactInfo.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {municipalityProfile.contactInfo.email && (
                    <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <Mail className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-gray-600">{municipalityProfile.contactInfo.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                {municipalityProfile.contactInfo.address && (
                  <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <MapPin className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm text-gray-600">{municipalityProfile.contactInfo.address}</p>
                    </div>
                  </div>
                )}

                {municipalityProfile.website && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <Globe className="h-4 w-4 text-orange-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Website</p>
                      <a 
                        href={municipalityProfile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {municipalityProfile.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}

                {municipalityProfile.socialMedia && (
                  <div>
                    <h4 className="font-semibold mb-3">Follow Us</h4>
                    <div className="flex gap-2">
                      {municipalityProfile.socialMedia.facebook && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`https://facebook.com/${municipalityProfile.socialMedia.facebook}`} target="_blank" rel="noopener noreferrer">
                            <Facebook className="h-4 w-4 mr-1" />
                            Facebook
                          </a>
                        </Button>
                      )}
                      {municipalityProfile.socialMedia.twitter && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`https://twitter.com/${municipalityProfile.socialMedia.twitter}`} target="_blank" rel="noopener noreferrer">
                            <Twitter className="h-4 w-4 mr-1" />
                            Twitter
                          </a>
                        </Button>
                      )}
                      {municipalityProfile.socialMedia.instagram && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`https://instagram.com/${municipalityProfile.socialMedia.instagram}`} target="_blank" rel="noopener noreferrer">
                            <Instagram className="h-4 w-4 mr-1" />
                            Instagram
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
