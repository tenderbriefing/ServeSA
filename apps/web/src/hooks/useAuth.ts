/**
 * Citizen auth hook — delegates to AuthProvider (JWT claims-aware).
 * Do not recreate privilege checks from Firestore profile fields.
 */
export { useAuth } from '@/components/providers/AuthProvider'
