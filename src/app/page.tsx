import { Search, MapPin, Star, Users, Shield, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Welcome to <span className="text-yellow-300">ServeSA</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Connecting South Africans with quality services. Find trusted professionals, 
              book appointments, and get things done in your community.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="What service do you need?"
                  className="w-full px-6 py-4 text-lg text-gray-900 rounded-full pl-14 pr-4 focus:outline-none focus:ring-4 focus:ring-white/20"
                />
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-full transition-colors">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose ServeSA?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We make it easy to find and book trusted services in your area
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Professionals</h3>
              <p className="text-gray-600">
                All service providers are background-checked and verified for your safety
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quick & Easy</h3>
              <p className="text-gray-600">
                Book services in minutes with our streamlined booking process
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Guaranteed</h3>
              <p className="text-gray-600">
                Rate and review services to help others make informed decisions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Popular Services
            </h2>
            <p className="text-xl text-gray-600">
              Discover the most requested services in your area
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Home Cleaning', icon: '🏠', count: '2,450+' },
              { name: 'Plumbing', icon: '🔧', count: '1,890+' },
              { name: 'Electrical', icon: '⚡', count: '1,234+' },
              { name: 'Gardening', icon: '🌱', count: '987+' },
              { name: 'Tutoring', icon: '📚', count: '756+' },
              { name: 'Pet Care', icon: '🐕', count: '543+' },
              { name: 'Photography', icon: '📸', count: '432+' },
              { name: 'Moving', icon: '📦', count: '321+' },
            ].map((service, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-4xl mb-3">{service.icon}</div>
                <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
                <p className="text-gray-600">{service.count} providers</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of South Africans who trust ServeSA for their service needs
          </p>
          <div className="space-x-4">
            <button className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
              Find Services
            </button>
            <button className="btn-secondary bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary-600">
              Become a Provider
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
