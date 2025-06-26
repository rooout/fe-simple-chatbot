'use client';

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    return {
      user: null,
      loading: false,
      skipAuthentication: () => {
        console.log('Skip authentication called from default context')
        localStorage.setItem('skipAuth', 'true')
        window.location.reload()
      },
      signOut: async () => ({ error: null }),
      authError: 'Auth context not available'
    }
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (error) {
        console.error('Session error:', error)
        setAuthError(error.message)
        setLoading(false)
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (event === 'SIGNED_IN' && session) {
          // User successfully signed in
          console.log('User signed in:', session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    loading,
    authError,
    skipAuthentication: () => {
      console.log('Skipping authentication via context method...');
      localStorage.setItem('skipAuth', 'true');
      setUser({ id: 'test-user', email: 'test@example.com', user_metadata: { full_name: 'Test User' } });
      setLoading(false);
    },
    signOut: async () => {
      const skipAuth = typeof window !== 'undefined' && localStorage.getItem('skipAuth')
      if (skipAuth) {
        localStorage.removeItem('skipAuth')
        setUser(null)
        window.location.reload()
      } else {
        try {
          await supabase.auth.signOut()
        } catch (error) {
          console.error('Error signing out:', error)
        }
      }
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
