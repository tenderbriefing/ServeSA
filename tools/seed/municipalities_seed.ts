#!/usr/bin/env ts-node

/**
 * ServeSA Phase-1: Municipalities Seed Data Loader
 * This script loads municipality data from CSV into Firestore
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import * as path from 'path'

// Initialize Firebase Admin
const serviceAccount = process.env.FIREBASE_ADMIN_KEY
  ? JSON.parse(process.env.FIREBASE_ADMIN_KEY)
  : require('../../apps/functions/service-account-key.json')

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.PROJECT_ID || 'servesa-aad53'
})

const db = getFirestore(app)

interface MunicipalityData {
  municipality_id: string
  municipality_name: string
  municipality_type: string
  province: string
  contact_email: string
  contact_phone: string
  website: string
  population: number
  area_km2: number
}

interface MunicipalityDocument {
  municipalityId: string
  municipalityName: string
  municipalityType: string
  province: string
  contactEmail: string
  contactPhone: string
  website: string
  population: number
  areaKm2: number
  slaConfig: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

async function loadMunicipalities() {
  try {
    console.log('🏙️ Loading municipalities into Firestore...')
    
    // Read CSV file
    const csvPath = path.join(__dirname, '../../data/seeds/municipalities.csv')
    const csvContent = readFileSync(csvPath, 'utf-8')
    
    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      cast: (value, context) => {
        if (context.column === 'population' || context.column === 'area_km2') {
          return parseInt(value, 10)
        }
        return value
      }
    }) as MunicipalityData[]
    
    console.log(`📊 Found ${records.length} municipalities to load`)
    
    // Load service catalog for SLA configuration
    const serviceCatalogPath = path.join(__dirname, '../../data/seeds/service_catalog.json')
    const serviceCatalog = JSON.parse(readFileSync(serviceCatalogPath, 'utf-8'))
    
    // Transform and upload data
    const batch = db.batch()
    let successCount = 0
    let errorCount = 0
    
    for (const record of records) {
      try {
        // Transform data to Firestore format
        const municipalityDoc: MunicipalityDocument = {
          municipalityId: record.municipality_id,
          municipalityName: record.municipality_name,
          municipalityType: record.municipality_type,
          province: record.province,
          contactEmail: record.contact_email,
          contactPhone: record.contact_phone,
          website: record.website,
          population: record.population,
          areaKm2: record.area_km2,
          slaConfig: serviceCatalog.municipality_slas[record.municipality_id] || 
                    serviceCatalog.municipality_slas['JHB001'], // Default to Johannesburg SLA
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        // Add to batch
        const docRef = db.collection('municipalities').doc(record.municipality_id)
        batch.set(docRef, municipalityDoc)
        
        successCount++
        console.log(`✅ Prepared ${record.municipality_name} (${record.municipality_id})`)
        
      } catch (error) {
        console.error(`❌ Error processing ${record.municipality_name}:`, error)
        errorCount++
      }
    }
    
    // Commit batch
    console.log('💾 Committing batch to Firestore...')
    await batch.commit()
    
    console.log('✅ Municipalities loaded successfully!')
    console.log(`📈 Summary:`)
    console.log(`   - Successfully loaded: ${successCount}`)
    console.log(`   - Errors: ${errorCount}`)
    console.log(`   - Total processed: ${records.length}`)
    
  } catch (error) {
    console.error('❌ Error loading municipalities:', error)
    process.exit(1)
  }
}

async function loadServiceCatalog() {
  try {
    console.log('📋 Loading service catalog into Firestore...')
    
    // Read service catalog
    const serviceCatalogPath = path.join(__dirname, '../../data/seeds/service_catalog.json')
    const serviceCatalog = JSON.parse(readFileSync(serviceCatalogPath, 'utf-8'))
    
    // Upload to Firestore
    const catalogRef = db.collection('config').doc('service_catalog')
    await catalogRef.set({
      ...serviceCatalog,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    console.log('✅ Service catalog loaded successfully!')
    
  } catch (error) {
    console.error('❌ Error loading service catalog:', error)
    process.exit(1)
  }
}

async function validateData() {
  try {
    console.log('🔍 Validating loaded data...')
    
    // Check municipalities
    const municipalitiesSnapshot = await db.collection('municipalities').get()
    console.log(`📊 Municipalities in Firestore: ${municipalitiesSnapshot.size}`)
    
    // Check service catalog
    const catalogDoc = await db.collection('config').doc('service_catalog').get()
    if (catalogDoc.exists) {
      console.log('✅ Service catalog found in Firestore')
    } else {
      console.log('❌ Service catalog not found in Firestore')
    }
    
    // Sample data validation
    const sampleMunicipality = municipalitiesSnapshot.docs[0]?.data()
    if (sampleMunicipality) {
      console.log('📋 Sample municipality data:')
      console.log(`   - Name: ${sampleMunicipality.municipalityName}`)
      console.log(`   - Province: ${sampleMunicipality.province}`)
      console.log(`   - Population: ${sampleMunicipality.population?.toLocaleString()}`)
      console.log(`   - SLA Config: ${Object.keys(sampleMunicipality.slaConfig || {}).length} categories`)
    }
    
  } catch (error) {
    console.error('❌ Error validating data:', error)
  }
}

async function main() {
  console.log('🚀 ServeSA Phase-1: Data Seeding')
  console.log('================================')
  
  // Load service catalog first
  await loadServiceCatalog()
  
  // Load municipalities
  await loadMunicipalities()
  
  // Validate loaded data
  await validateData()
  
  console.log('🎉 Data seeding completed successfully!')
  process.exit(0)
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
}

export { loadMunicipalities, loadServiceCatalog, validateData }
