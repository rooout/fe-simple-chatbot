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
    let mounted = true;
    
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...')
        
        const skipAuth = typeof window !== 'undefined' && localStorage.getItem('skipAuth')
        if (skipAuth) {
          console.log('Authentication skipped for testing')
          if (mounted) {
            setUser({ id: 'test-user', email: 'test@example.com', user_metadata: { full_name: 'Test User' } })
            setLoading(false)
          }
          return
        }
        
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.warn('Supabase not configured, running in offline mode')
          if (mounted) {
            setUser(null)
            setLoading(false)
            setAuthError('Supabase not configured')
          }
          return
        }
        
        const timeoutId = setTimeout(() => {
          if (mounted) {
            console.log('Session check timed out, assuming no user')
            setUser(null)
            setLoading(false)
          }
        }, 5000)
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        clearTimeout(timeoutId)
        
        if (!mounted) return
        
        if (error) {
          console.error('Error getting session:', error)
          setUser(null)
          setAuthError(error.message)
        } else {
          console.log('Initial session:', session)
          setUser(session?.user ?? null)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        if (mounted) {
          setUser(null)
          setLoading(false)
          setAuthError(error.message)
        }
      }
    }

    getInitialSession()

    // Only set up auth listener if Supabase is configured
    let subscription;
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session)
            if (mounted) {
              setUser(session?.user ?? null)
              setLoading(false)
            }
          }
        )
        subscription = authSubscription
      }
    } catch (error) {
      console.error('Error setting up auth listener:', error)
    }

    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
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
