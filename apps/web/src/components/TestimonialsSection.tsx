'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: 'Sarah Mkhize',
    role: 'Resident',
    location: 'Soweto, Johannesburg',
    content: 'ServeSA helped me report a water leak that was causing damage to my property. The municipality responded within 24 hours and fixed it completely. This platform is a game-changer for our community.',
    rating: 5,
    avatar: 'SM'
  },
  {
    id: 2,
    name: 'David van der Merwe',
    role: 'Ward Councillor',
    location: 'Cape Town',
    content: 'As a ward councillor, ServeSA has made it much easier to track and respond to issues in my area. The real-time updates and detailed reporting help us serve our community better.',
    rating: 5,
    avatar: 'DV'
  },
  {
    id: 3,
    name: 'Nomsa Dlamini',
    role: 'Municipal Official',
    location: 'Durban',
    content: 'The platform streamlines our workflow significantly. We can prioritize cases based on severity and location, ensuring critical issues get immediate attention.',
    rating: 4,
    avatar: 'ND'
  },
  {
    id: 4,
    name: 'Michael Botha',
    role: 'Business Owner',
    location: 'Pretoria',
    content: 'I reported a street light issue outside my shop. Within 48 hours, it was fixed. The transparency and tracking features give me confidence that my reports are being handled properly.',
    rating: 5,
    avatar: 'MB'
  },
  {
    id: 5,
    name: 'Zanele Nkosi',
    role: 'Community Leader',
    location: 'Port Elizabeth',
    content: 'ServeSA has empowered our community to take action. We can now report issues easily and track progress. It\'s building trust between citizens and local government.',
    rating: 5,
    avatar: 'ZN'
  },
  {
    id: 6,
    name: 'Pieter de Villiers',
    role: 'Municipal Engineer',
    location: 'Bloemfontein',
    content: 'The technical integration with our existing systems is seamless. The detailed case information and media attachments help us diagnose and fix issues more efficiently.',
    rating: 4,
    avatar: 'PD'
  }
]

export function TestimonialsSection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            What People Are Saying
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Hear from citizens, officials, and community leaders about how ServeSA is transforming service delivery across South Africa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">
                        {testimonial.avatar}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        {testimonial.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {testimonial.role} • {testimonial.location}
                      </CardDescription>
                    </div>
                  </div>
                  <Quote className="w-5 h-5 text-gray-300" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < testimonial.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  "{testimonial.content}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
            <span>Average rating:</span>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 text-yellow-400 fill-current"
                />
              ))}
            </div>
            <span>4.8/5 from 2,847 reviews</span>
          </div>
        </div>
      </div>
    </section>
  )
}
