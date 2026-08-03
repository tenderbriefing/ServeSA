// South African Provinces and Municipalities Data
export interface Municipality {
  code: string
  name: string
  type: 'Metropolitan' | 'District' | 'Local'
  province: string
}

export interface Province {
  code: string
  name: string
  municipalities: Municipality[]
}

export const southAfricaProvinces: Province[] = [
  {
    code: 'GP',
    name: 'Gauteng',
    municipalities: [
      { code: 'JHB', name: 'City of Johannesburg', type: 'Metropolitan', province: 'GP' },
      { code: 'TSH', name: 'City of Tshwane', type: 'Metropolitan', province: 'GP' },
      { code: 'EKU', name: 'City of Ekurhuleni', type: 'Metropolitan', province: 'GP' },
      { code: 'WTS', name: 'West Rand District', type: 'District', province: 'GP' },
      { code: 'SED', name: 'Sedibeng District', type: 'District', province: 'GP' },
      { code: 'MTS', name: 'Metsweding District', type: 'District', province: 'GP' }
    ]
  },
  {
    code: 'WC',
    name: 'Western Cape',
    municipalities: [
      { code: 'CPT', name: 'City of Cape Town', type: 'Metropolitan', province: 'WC' },
      { code: 'WCD', name: 'West Coast District', type: 'District', province: 'WC' },
      { code: 'CAC', name: 'Cape Winelands District', type: 'District', province: 'WC' },
      { code: 'OVB', name: 'Overberg District', type: 'District', province: 'WC' },
      { code: 'EDE', name: 'Eden District', type: 'District', province: 'WC' },
      { code: 'CAC', name: 'Central Karoo District', type: 'District', province: 'WC' }
    ]
  },
  {
    code: 'KZN',
    name: 'KwaZulu-Natal',
    municipalities: [
      { code: 'DBN', name: 'eThekwini', type: 'Metropolitan', province: 'KZN' },
      { code: 'UML', name: 'uMgungundlovu District', type: 'District', province: 'KZN' },
      { code: 'UML', name: 'uMkhanyakude District', type: 'District', province: 'KZN' },
      { code: 'UML', name: 'uMzinyathi District', type: 'District', province: 'KZN' },
      { code: 'UML', name: 'uThukela District', type: 'District', province: 'KZN' },
      { code: 'UML', name: 'Zululand District', type: 'District', province: 'KZN' }
    ]
  },
  {
    code: 'EC',
    name: 'Eastern Cape',
    municipalities: [
      { code: 'NMA', name: 'Nelson Mandela Bay', type: 'Metropolitan', province: 'EC' },
      { code: 'BUF', name: 'Buffalo City', type: 'Metropolitan', province: 'EC' },
      { code: 'AMA', name: 'Amathole District', type: 'District', province: 'EC' },
      { code: 'CHR', name: 'Chris Hani District', type: 'District', province: 'EC' },
      { code: 'JKE', name: 'Joe Gqabi District', type: 'District', province: 'EC' },
      { code: 'ORB', name: 'OR Tambo District', type: 'District', province: 'EC' }
    ]
  },
  {
    code: 'FS',
    name: 'Free State',
    municipalities: [
      { code: 'MAN', name: 'Mangaung', type: 'Metropolitan', province: 'FS' },
      { code: 'XHA', name: 'Xhariep District', type: 'District', province: 'FS' },
      { code: 'LEJ', name: 'Lejweleputswa District', type: 'District', province: 'FS' },
      { code: 'THA', name: 'Thabo Mofutsanyana District', type: 'District', province: 'FS' },
      { code: 'FEE', name: 'Fezile Dabi District', type: 'District', province: 'FS' }
    ]
  },
  {
    code: 'LP',
    name: 'Limpopo',
    municipalities: [
      { code: 'POL', name: 'Polokwane', type: 'Local', province: 'LP' },
      { code: 'MOP', name: 'Mopani District', type: 'District', province: 'LP' },
      { code: 'VHE', name: 'Vhembe District', type: 'District', province: 'LP' },
      { code: 'CAP', name: 'Capricorn District', type: 'District', province: 'LP' },
      { code: 'WAT', name: 'Waterberg District', type: 'District', province: 'LP' },
      { code: 'SEK', name: 'Sekhukhune District', type: 'District', province: 'LP' }
    ]
  },
  {
    code: 'MP',
    name: 'Mpumalanga',
    municipalities: [
      { code: 'MBM', name: 'Mbombela', type: 'Local', province: 'MP' },
      { code: 'EHL', name: 'Ehlanzeni District', type: 'District', province: 'MP' },
      { code: 'GTR', name: 'Gert Sibande District', type: 'District', province: 'MP' },
      { code: 'NKZ', name: 'Nkangala District', type: 'District', province: 'MP' }
    ]
  },
  {
    code: 'NC',
    name: 'Northern Cape',
    municipalities: [
      { code: 'KIM', name: 'Sol Plaatje', type: 'Local', province: 'NC' },
      { code: 'FRN', name: 'Frances Baard District', type: 'District', province: 'NC' },
      { code: 'JTG', name: 'John Taolo Gaetsewe District', type: 'District', province: 'NC' },
      { code: 'NMA', name: 'Namakwa District', type: 'District', province: 'NC' },
      { code: 'PIX', name: 'Pixley ka Seme District', type: 'District', province: 'NC' },
      { code: 'SIV', name: 'Siyanda District', type: 'District', province: 'NC' }
    ]
  },
  {
    code: 'NW',
    name: 'North West',
    municipalities: [
      { code: 'MAF', name: 'Mahikeng', type: 'Local', province: 'NW' },
      { code: 'BJT', name: 'Bojanala Platinum District', type: 'District', province: 'NW' },
      { code: 'NGM', name: 'Ngaka Modiri Molema District', type: 'District', province: 'NW' },
      { code: 'DRK', name: 'Dr Ruth Segomotsi Mompati District', type: 'District', province: 'NW' },
      { code: 'KEN', name: 'Dr Kenneth Kaunda District', type: 'District', province: 'NW' }
    ]
  }
]

export const getAllMunicipalities = (): Municipality[] => {
  return southAfricaProvinces.flatMap(province => province.municipalities)
}

export const getMunicipalitiesByProvince = (provinceCode: string): Municipality[] => {
  const province = southAfricaProvinces.find(p => p.code === provinceCode)
  return province ? province.municipalities : []
}

export const getProvinceByMunicipality = (municipalityCode: string): Province | null => {
  return southAfricaProvinces.find(province => 
    province.municipalities.some(municipality => municipality.code === municipalityCode)
  ) || null
}
