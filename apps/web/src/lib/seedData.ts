// Seed data for ServeSA platform
export const seedDepartments = [
  {
    id: 'dept-water-jhb',
    name: 'Water & Sanitation - Johannesburg',
    description: 'Responsible for water supply, sewage, and sanitation services in Johannesburg',
    category: 'utilities',
    contactEmail: 'water@joburg.org.za',
    contactPhone: '+27 11 375 5555',
    operatingHours: 'Mon-Fri 7:00-16:00, Emergency: 24/7',
    staffCount: 45,
    responseTime: '24-48 hours',
    isOnline: true,
    municipalityCode: 'JHB',
    services: ['Water supply', 'Sewage maintenance', 'Water quality testing', 'Emergency repairs']
  },
  {
    id: 'dept-electricity-jhb',
    name: 'Electricity - Johannesburg',
    description: 'Power supply, street lighting, and electrical infrastructure maintenance',
    category: 'utilities',
    contactEmail: 'electricity@joburg.org.za',
    contactPhone: '+27 11 375 6666',
    operatingHours: '24/7 Emergency Service',
    staffCount: 28,
    responseTime: '2-4 hours (emergency)',
    isOnline: true,
    municipalityCode: 'JHB',
    services: ['Power supply', 'Street lighting', 'Electrical repairs', 'Emergency response']
  },
  {
    id: 'dept-roads-jhb',
    name: 'Roads & Transport - Johannesburg',
    description: 'Maintenance and development of roads, traffic management, and public transport',
    category: 'infrastructure',
    contactEmail: 'roads@joburg.org.za',
    contactPhone: '+27 11 375 7777',
    operatingHours: 'Mon-Fri 7:00-18:00',
    staffCount: 32,
    responseTime: '48-72 hours',
    isOnline: true,
    municipalityCode: 'JHB',
    services: ['Road maintenance', 'Traffic management', 'Public transport', 'Infrastructure development']
  },
  {
    id: 'dept-waste-jhb',
    name: 'Waste Management - Johannesburg',
    description: 'Garbage collection, recycling, and waste disposal services',
    category: 'environment',
    contactEmail: 'waste@joburg.org.za',
    contactPhone: '+27 11 375 8888',
    operatingHours: 'Mon-Sat 6:00-16:00',
    staffCount: 55,
    responseTime: '24-48 hours',
    isOnline: true,
    municipalityCode: 'JHB',
    services: ['Garbage collection', 'Recycling programs', 'Waste disposal', 'Environmental cleanup']
  },
  {
    id: 'dept-parks-jhb',
    name: 'Parks & Recreation - Johannesburg',
    description: 'Public parks, sports facilities, and recreational areas maintenance',
    category: 'community',
    contactEmail: 'parks@joburg.org.za',
    contactPhone: '+27 11 375 9999',
    operatingHours: 'Mon-Fri 8:00-17:00',
    staffCount: 18,
    responseTime: '72-96 hours',
    isOnline: true,
    municipalityCode: 'JHB',
    services: ['Park maintenance', 'Sports facilities', 'Recreational programs', 'Community events']
  }
]

export const seedCategories = [
  {
    id: 'water-sewage',
    name: 'Water & Sewage',
    description: 'Water supply, sewage, and sanitation issues',
    icon: '💧',
    sla: 24,
    priority: 'high',
    color: '#3B82F6'
  },
  {
    id: 'electricity',
    name: 'Electricity',
    description: 'Power supply, street lighting, and electrical issues',
    icon: '⚡',
    sla: 4,
    priority: 'urgent',
    color: '#F59E0B'
  },
  {
    id: 'roads-infrastructure',
    name: 'Roads & Infrastructure',
    description: 'Roads, bridges, and transportation infrastructure',
    icon: '🛣️',
    sla: 72,
    priority: 'medium',
    color: '#10B981'
  },
  {
    id: 'waste-management',
    name: 'Waste Management',
    description: 'Garbage collection, recycling, and waste disposal',
    icon: '🗑️',
    sla: 48,
    priority: 'medium',
    color: '#8B5CF6'
  },
  {
    id: 'digital-services',
    name: 'Digital Services',
    description: 'IT support, digital platforms, and online services',
    icon: '💻',
    sla: 168,
    priority: 'low',
    color: '#06B6D4'
  },
  {
    id: 'emergency-services',
    name: 'Emergency Services',
    description: 'Emergency response, disaster management, and crisis support',
    icon: '🚨',
    sla: 1,
    priority: 'urgent',
    color: '#EF4444'
  }
]

export const seedSampleCases = [
  {
    id: 'case-001',
    title: 'Water leak on Main Street',
    description: 'Large water leak affecting traffic and nearby businesses. Water flowing onto the road causing traffic disruption.',
    category: 'water-sewage',
    priority: 'high',
    status: 'IN_PROGRESS',
    location: {
      address: 'Main Street, Johannesburg CBD',
      coordinates: { lat: -26.2041, lng: 28.0473 },
      ward: 'Ward 58',
      municipality: 'Johannesburg'
    },
    reporter: {
      name: 'Sarah Mkhize',
      email: 'sarah.mkhize@email.com',
      phone: '+27 82 123 4567'
    },
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-16T14:20:00Z'),
    estimatedResolution: new Date('2024-01-18T12:00:00Z'),
    assignedTo: 'dept-water-jhb'
  },
  {
    id: 'case-002',
    title: 'Pothole on Oak Avenue',
    description: 'Large pothole causing damage to vehicles. Multiple complaints received from residents.',
    category: 'roads-infrastructure',
    priority: 'medium',
    status: 'ACK',
    location: {
      address: 'Oak Avenue, Sandton',
      coordinates: { lat: -26.1076, lng: 28.0567 },
      ward: 'Ward 59',
      municipality: 'Johannesburg'
    },
    reporter: {
      name: 'David van der Merwe',
      email: 'david.vdm@email.com',
      phone: '+27 83 234 5678'
    },
    createdAt: new Date('2024-01-14T16:45:00Z'),
    updatedAt: new Date('2024-01-15T09:15:00Z'),
    estimatedResolution: new Date('2024-01-20T12:00:00Z'),
    assignedTo: 'dept-roads-jhb'
  },
  {
    id: 'case-003',
    title: 'Street light not working',
    description: 'Street light on Pine Street has been out for 3 days. Very dark and unsafe for pedestrians.',
    category: 'electricity',
    priority: 'medium',
    status: 'RESOLVED',
    location: {
      address: 'Pine Street, Rosebank',
      coordinates: { lat: -26.1467, lng: 28.0436 },
      ward: 'Ward 60',
      municipality: 'Johannesburg'
    },
    reporter: {
      name: 'Nomsa Dlamini',
      email: 'nomsa.dlamini@email.com',
      phone: '+27 84 345 6789'
    },
    createdAt: new Date('2024-01-10T19:20:00Z'),
    updatedAt: new Date('2024-01-12T11:30:00Z'),
    resolvedAt: new Date('2024-01-12T11:30:00Z'),
    assignedTo: 'dept-electricity-jhb'
  }
]

export const seedForumTopics = [
  {
    id: 'topic-001',
    title: 'Water issues in Ward 58 - need urgent attention',
    content: 'We have been experiencing water shortages for the past week. Multiple households affected. Has anyone else noticed this?',
    author: 'Sarah Mkhize',
    authorAvatar: 'SM',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    replies: 12,
    likes: 45,
    dislikes: 2,
    tags: ['water', 'ward-58', 'urgent'],
    isPopular: true,
    isRecent: true,
    category: 'water-sewage'
  },
  {
    id: 'topic-002',
    title: 'Street lighting improvements needed',
    content: 'The street lights on Oak Avenue are not working properly. It\'s very dark at night and unsafe for pedestrians.',
    author: 'David van der Merwe',
    authorAvatar: 'DV',
    createdAt: new Date('2024-01-14T16:45:00Z'),
    replies: 8,
    likes: 23,
    dislikes: 1,
    tags: ['lighting', 'safety', 'infrastructure'],
    isPopular: false,
    isRecent: true,
    category: 'electricity'
  },
  {
    id: 'topic-003',
    title: 'Community cleanup initiative - join us!',
    content: 'We are organizing a community cleanup this Saturday. All volunteers welcome. Let\'s make our neighborhood beautiful!',
    author: 'Nomsa Dlamini',
    authorAvatar: 'ND',
    createdAt: new Date('2024-01-13T09:20:00Z'),
    replies: 15,
    likes: 67,
    dislikes: 0,
    tags: ['community', 'volunteer', 'cleanup'],
    isPopular: true,
    isRecent: false,
    category: 'waste-management'
  }
]

export const seedVotableIssues = [
  {
    id: 'vote-001',
    title: 'Major water leak on Main Street',
    description: 'Large water leak affecting traffic and nearby businesses. Water flowing onto the road.',
    category: 'Water & Sewage',
    location: 'Ward 58, Johannesburg',
    priority: 'high',
    votes: 156,
    upvotes: 142,
    downvotes: 14,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    status: 'acknowledged',
    impact: 500,
    urgency: 8,
    upvoters: [],
    downvoters: []
  },
  {
    id: 'vote-002',
    title: 'Pothole causing vehicle damage',
    description: 'Large pothole on Oak Avenue causing damage to vehicles. Multiple complaints received.',
    category: 'Roads & Infrastructure',
    location: 'Ward 59, Johannesburg',
    priority: 'medium',
    votes: 89,
    upvotes: 78,
    downvotes: 11,
    createdAt: new Date('2024-01-14T16:45:00Z'),
    status: 'pending',
    impact: 200,
    urgency: 6,
    upvoters: [],
    downvoters: []
  },
  {
    id: 'vote-003',
    title: 'Street lights not working',
    description: 'All street lights on Pine Street have been out for 3 days. Very dark and unsafe.',
    category: 'Electricity',
    location: 'Ward 60, Johannesburg',
    priority: 'medium',
    votes: 234,
    upvotes: 218,
    downvotes: 16,
    createdAt: new Date('2024-01-13T19:20:00Z'),
    status: 'in_progress',
    impact: 300,
    urgency: 7,
    upvoters: [],
    downvoters: []
  }
]
