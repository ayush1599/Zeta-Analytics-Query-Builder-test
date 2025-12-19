import React, { createContext, useContext, useEffect, useState } from 'react'
import { toast } from '@/hooks/use-toast'

// Mock User interface since we removed Supabase
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

// Mock Session interface
export interface Session {
  user: User
  access_token: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for session
    const storedSession = localStorage.getItem('auth_session')
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession)
        setSession(parsedSession)
        setUser(parsedSession.user)
      } catch (e) {
        console.error("Failed to parse session", e)
        localStorage.removeItem('auth_session')
      }
    }
    setLoading(false)
  }, [])

  const signUp = async (email: string, password: string) => {
    toast({
      title: "Sign up disabled",
      description: "Please contact administrator for access.",
      variant: "destructive"
    })
  }

  const signIn = async (email: string, password: string) => {
    try {
      if (password === "Zetatest@123") {
        const mockUser: User = {
          id: 'static-user-id',
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const mockSession: Session = {
          user: mockUser,
          access_token: 'static-mock-token'
        }

        setUser(mockUser)
        setSession(mockSession)
        localStorage.setItem('auth_session', JSON.stringify(mockSession))
        
        toast({
          title: "Welcome back!",
          description: "You have been successfully signed in.",
        })
      } else {
        throw new Error("Invalid password")
      }
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  const signOut = async () => {
    setUser(null)
    setSession(null)
    localStorage.removeItem('auth_session')
    
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    })
  }

  const resetPassword = async (email: string) => {
    toast({
      title: "Feature unavailable",
      description: "Please contact administrator to reset password.",
      variant: "destructive"
    })
  }

  const updatePassword = async (newPassword: string) => {
    toast({
      title: "Feature unavailable",
      description: "Password updates are disabled in static mode.",
      variant: "destructive"
    })
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}