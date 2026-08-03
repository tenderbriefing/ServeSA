import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { seedDepartments, seedCategories, seedSampleCases, seedForumTopics, seedVotableIssues } from './seedData'

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')

    // Seed Departments
    console.log('📋 Seeding departments...')
    for (const dept of seedDepartments) {
      await addDoc(collection(db, 'departments'), {
        ...dept,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }

    // Seed Categories
    console.log('📂 Seeding categories...')
    for (const category of seedCategories) {
      await addDoc(collection(db, 'categories'), {
        ...category,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }

    // Seed Sample Cases
    console.log('📄 Seeding sample cases...')
    for (const caseItem of seedSampleCases) {
      await addDoc(collection(db, 'cases'), {
        ...caseItem,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }

    // Seed Forum Topics
    console.log('💬 Seeding forum topics...')
    for (const topic of seedForumTopics) {
      await addDoc(collection(db, 'forumTopics'), {
        ...topic,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }

    // Seed Votable Issues
    console.log('🗳️ Seeding votable issues...')
    for (const issue of seedVotableIssues) {
      await addDoc(collection(db, 'votableIssues'), {
        ...issue,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }

    console.log('✅ Database seeding completed successfully!')
    return { success: true, message: 'Database seeded successfully' }
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Function to check if database is already seeded
export async function isDatabaseSeeded() {
  try {
    const { getDocs } = await import('firebase/firestore')
    const departmentsSnapshot = await getDocs(collection(db, 'departments'))
    return departmentsSnapshot.size > 0
  } catch (error) {
    console.error('Error checking database seed status:', error)
    return false
  }
}
