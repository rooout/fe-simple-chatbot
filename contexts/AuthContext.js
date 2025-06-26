'use client';

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true;
    
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...')
        
        const skipAuth = typeof window !== 'undefined' && localStorage.getItem('skipAuth')
        if (skipAuth) {
          console.log('Authentication skipped for testing')
          setUser({ id: 'test-user', email: 'test@example.com' })
          setLoading(false)
          return
        }
        
        const timeoutId = setTimeout(() => {
          if (mounted) {
            console.log('Session check timed out, assuming no user')
            setUser(null)
            setLoading(false)
          }
        }, 3000)
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        clearTimeout(timeoutId)
        
        if (!mounted) return
        
        if (error) {
          console.error('Error getting session:', error)
          setUser(null)
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
        }
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session)
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    loading,
    signOut: async () => {
      const skipAuth = typeof window !== 'undefined' && localStorage.getItem('skipAuth')
      if (skipAuth) {
        localStorage.removeItem('skipAuth')
        window.location.reload()
      } else {
        await supabase.auth.signOut()
      }
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
