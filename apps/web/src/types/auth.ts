export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
}

export interface UserProfile {
  uid: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  userType: 'citizen' | 'department' | 'admin'
  province?: string
  municipalityCode?: string
  createdAt: Date
  updatedAt: Date
}

export interface AuthState {
  user: AuthUser | null
  userProfile: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  isOfficial: boolean
  isAdmin: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials extends LoginCredentials {
  firstName: string
  lastName: string
  phone?: string
  userType: 'citizen' | 'department' | 'admin'
  province?: string
  municipalityCode?: string
}
