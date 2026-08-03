import { Municipality } from './southAfricaData'

export interface MunicipalityProfile {
  code: string
  name: string
  province: string
  type: 'Metropolitan' | 'District' | 'Local'
  population?: string
  area?: string
  established?: string
  mayor?: string
  website?: string
  funFacts: string[]
  landmarks: string[]
  localServices: string[]
  contactInfo: {
    phone?: string
    email?: string
    address?: string
  }
  socialMedia?: {
    facebook?: string
    twitter?: string
    instagram?: string
  }
  localNews?: string[]
  upcomingEvents?: string[]
}

export const municipalityProfiles: MunicipalityProfile[] = [
  {
    code: 'JHB',
    name: 'City of Johannesburg',
    province: 'GP',
    type: 'Metropolitan',
    population: '5.6 million',
    area: '1,645 km²',
    established: '1886',
    mayor: 'Kabelo Gwamanda',
    website: 'https://www.joburg.org.za',
    funFacts: [
      'Johannesburg is the largest city in South Africa and the economic hub of the continent',
      'The city was founded after gold was discovered in 1886, earning it the nickname "City of Gold"',
      'Johannesburg is home to the tallest building in Africa - the Carlton Centre',
      'The city has over 10 million trees, making it one of the largest man-made forests in the world',
      'Johannesburg is the only major city in the world not built on a river, lake, or coastline'
    ],
    landmarks: [
      'Constitution Hill',
      'Apartheid Museum',
      'Soweto Towers',
      'Gold Reef City',
      'Walter Sisulu Botanical Gardens',
      'Johannesburg Zoo'
    ],
    localServices: [
      'Water and Sanitation',
      'Electricity Supply',
      'Waste Management',
      'Road Maintenance',
      'Public Transport (Rea Vaya)',
      'Parks and Recreation',
      'Libraries and Community Centers'
    ],
    contactInfo: {
      phone: '011 407 6111',
      email: 'info@joburg.org.za',
      address: 'Civic Centre, 158 Civic Boulevard, Braamfontein'
    },
    socialMedia: {
      facebook: 'CityofJohannesburg',
      twitter: 'CityofJoburgZA',
      instagram: 'cityofjoburg'
    },
    localNews: [
      'New BRT routes planned for 2024',
      'Water infrastructure upgrades in progress',
      'Community safety initiatives launched'
    ],
    upcomingEvents: [
      'Joburg Arts Alive Festival - September',
      'Heritage Day Celebrations - September 24',
      'Summer in the City - December'
    ]
  },
  {
    code: 'CPT',
    name: 'City of Cape Town',
    province: 'WC',
    type: 'Metropolitan',
    population: '4.6 million',
    area: '2,461 km²',
    established: '1652',
    mayor: 'Geordin Hill-Lewis',
    website: 'https://www.capetown.gov.za',
    funFacts: [
      'Cape Town is the oldest city in South Africa, founded in 1652',
      'Table Mountain is one of the New7Wonders of Nature',
      'The city has two UNESCO World Heritage Sites: Robben Island and Table Mountain',
      'Cape Town is known as the "Mother City" of South Africa',
      'The city has a Mediterranean climate with warm, dry summers and mild, wet winters'
    ],
    landmarks: [
      'Table Mountain',
      'Robben Island',
      'V&A Waterfront',
      'Cape Point',
      'Kirstenbosch National Botanical Garden',
      'Bo-Kaap'
    ],
    localServices: [
      'Water and Sanitation',
      'Electricity Supply',
      'Waste Management',
      'Road Maintenance',
      'MyCiTi Bus Service',
      'Parks and Recreation',
      'Libraries and Community Centers'
    ],
    contactInfo: {
      phone: '021 400 9111',
      email: 'info@capetown.gov.za',
      address: 'Civic Centre, 12 Hertzog Boulevard, Cape Town'
    },
    socialMedia: {
      facebook: 'CityofCapeTown',
      twitter: 'CityofCT',
      instagram: 'cityofcapetown'
    },
    localNews: [
      'Water conservation measures in place',
      'New cycling lanes being constructed',
      'Affordable housing projects approved'
    ],
    upcomingEvents: [
      'Cape Town International Jazz Festival - March',
      'Cape Town Carnival - March',
      'Festival of Lights - December'
    ]
  },
  {
    code: 'DBN',
    name: 'eThekwini',
    province: 'KZN',
    type: 'Metropolitan',
    population: '3.7 million',
    area: '2,292 km²',
    established: '1854',
    mayor: 'Mxolisi Kaunda',
    website: 'https://www.durban.gov.za',
    funFacts: [
      'Durban is the largest port in Africa and one of the busiest in the Southern Hemisphere',
      'The city has the largest Indian population outside of India',
      'Durban is known as the "Surf City" of South Africa',
      'The city has a subtropical climate with warm, humid summers',
      'Durban hosted the 2010 FIFA World Cup'
    ],
    landmarks: [
      'uShaka Marine World',
      'Golden Mile Beachfront',
      'Moses Mabhida Stadium',
      'Durban Botanic Gardens',
      'Victoria Street Market',
      'KwaMuhle Museum'
    ],
    localServices: [
      'Water and Sanitation',
      'Electricity Supply',
      'Waste Management',
      'Road Maintenance',
      'Public Transport (People Mover)',
      'Parks and Recreation',
      'Libraries and Community Centers'
    ],
    contactInfo: {
      phone: '031 311 1111',
      email: 'info@durban.gov.za',
      address: 'City Hall, 1 Dr Pixley KaSeme Street, Durban'
    },
    socialMedia: {
      facebook: 'eThekwiniMunicipality',
      twitter: 'eThekwiniM',
      instagram: 'ethekwini_municipality'
    },
    localNews: [
      'Beachfront revitalization project',
      'New bus rapid transit system',
      'Water infrastructure upgrades'
    ],
    upcomingEvents: [
      'Durban July - July',
      'Comrades Marathon - June',
      'Durban International Film Festival - July'
    ]
  },
  {
    code: 'TSH',
    name: 'City of Tshwane',
    province: 'GP',
    type: 'Metropolitan',
    population: '3.3 million',
    area: '6,298 km²',
    established: '1855',
    mayor: 'Cilliers Brink',
    website: 'https://www.tshwane.gov.za',
    funFacts: [
      'Pretoria is the administrative capital of South Africa',
      'The city is known as the "Jacaranda City" due to its thousands of jacaranda trees',
      'Pretoria is home to the Union Buildings, the official seat of the South African government',
      'The city has the highest number of embassies in South Africa',
      'Pretoria was renamed Tshwane in 2005 to reflect its African heritage'
    ],
    landmarks: [
      'Union Buildings',
      'Voortrekker Monument',
      'Freedom Park',
      'Pretoria National Botanical Garden',
      'Church Square',
      'Kruger House Museum'
    ],
    localServices: [
      'Water and Sanitation',
      'Electricity Supply',
      'Waste Management',
      'Road Maintenance',
      'A Re Yeng Bus Service',
      'Parks and Recreation',
      'Libraries and Community Centers'
    ],
    contactInfo: {
      phone: '012 358 9999',
      email: 'info@tshwane.gov.za',
      address: 'Municipal Building, 320 Madiba Street, Pretoria'
    },
    socialMedia: {
      facebook: 'CityofTshwane',
      twitter: 'CityofTshwane',
      instagram: 'cityoftshwane'
    },
    localNews: [
      'Smart city initiatives launched',
      'Public transport improvements',
      'Heritage preservation projects'
    ],
    upcomingEvents: [
      'Jacaranda Festival - October',
      'Freedom Day Celebrations - April 27',
      'Pretoria Show - August'
    ]
  },
  {
    code: 'NMA',
    name: 'Nelson Mandela Bay',
    province: 'EC',
    type: 'Metropolitan',
    population: '1.3 million',
    area: '1,959 km²',
    established: '1820',
    mayor: 'Gary van Niekerk',
    website: 'https://www.nelsonmandelabay.gov.za',
    funFacts: [
      'Port Elizabeth is known as the "Friendly City" and "Windy City"',
      'The city was renamed Nelson Mandela Bay in 2001 to honor Nelson Mandela',
      'It has one of the best beaches in South Africa - Hobie Beach',
      'The city is home to the largest Volkswagen manufacturing plant outside Germany',
      'Nelson Mandela Bay has a rich automotive industry heritage'
    ],
    landmarks: [
      'Donkin Reserve',
      'Bayworld Museum',
      'Sardinia Bay Nature Reserve',
      'Addo Elephant National Park',
      'Kragga Kamma Game Park',
      'The Boardwalk Casino'
    ],
    localServices: [
      'Water and Sanitation',
      'Electricity Supply',
      'Waste Management',
      'Road Maintenance',
      'Public Transport',
      'Parks and Recreation',
      'Libraries and Community Centers'
    ],
    contactInfo: {
      phone: '041 506 1911',
      email: 'info@nelsonmandelabay.gov.za',
      address: 'City Hall, Govan Mbeki Avenue, Port Elizabeth'
    },
    socialMedia: {
      facebook: 'NelsonMandelaBay',
      twitter: 'NMBayMunicipality',
      instagram: 'nelsonmandelabay'
    },
    localNews: [
      'Water crisis management',
      'Economic development initiatives',
      'Tourism promotion campaigns'
    ],
    upcomingEvents: [
      'Ironman 70.3 - April',
      'Nelson Mandela Bay Splash Festival - December',
      'Heritage Day Celebrations - September'
    ]
  }
]

export const getMunicipalityProfile = (municipalityCode: string): MunicipalityProfile | null => {
  return municipalityProfiles.find(profile => profile.code === municipalityCode) || null
}

export const getMunicipalityFunFacts = (municipalityCode: string): string[] => {
  const profile = getMunicipalityProfile(municipalityCode)
  return profile ? profile.funFacts : []
}

export const getMunicipalityLandmarks = (municipalityCode: string): string[] => {
  const profile = getMunicipalityProfile(municipalityCode)
  return profile ? profile.landmarks : []
}

export const getMunicipalityServices = (municipalityCode: string): string[] => {
  const profile = getMunicipalityProfile(municipalityCode)
  return profile ? profile.localServices : []
}
