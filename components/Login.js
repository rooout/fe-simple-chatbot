'use client';

import { useState } from 'react'
import { signInWithGoogle, signInWithGitHub } from '@/lib/supabase'
import { Github, Chrome, Bot, Mail } from 'lucide-react'
import EmailAuth from './EmailAuth'
import { useAuth } from '@/contexts/AuthContext'

const Login = () => {
  const [loading, setLoading] = useState('')
  const [showEmailAuth, setShowEmailAuth] = useState(false)
  
  let authContext = null;
  try {
    authContext = useAuth();
  } catch (error) {
    console.log('Auth context not available in Login component');
  }
  
  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (showEmailAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <EmailAuth onBack={() => setShowEmailAuth(false)} />
      </div>
    )
  }

const handleGoogleSignIn = async () => {
  setLoading('google')
  try {
    const { error } = await signInWithGoogle()
    if (error) {
      console.error('Google sign in error:', error)
      alert('Failed to sign in with Google: ' + error.message)
    }
  } catch (error) {
    console.error('Google OAuth error:', error)
    alert('An error occurred during Google sign in')
  } finally {
    setLoading('')
  }
}

  const handleGitHubLogin = async () => {
    setLoading('github')
    try {
      const { error } = await signInWithGitHub()
      if (error) {
        console.error('GitHub login error:', error)
        if (error.message.includes('not configured')) {
          alert('Authentication is not configured. Please use "Skip Authentication" for testing or configure Supabase.')
        } else {
          alert('Failed to sign in with GitHub. Please try again.')
        }
      }
    } catch (error) {
      console.error('GitHub login error:', error)
      alert('Failed to sign in with GitHub. Please try again.')
    } finally {
      setLoading('')
    }
  }

  const handleSkipAuth = () => {
    console.log('Skipping authentication...')
    
    if (authContext?.skipAuthentication) {
      authContext.skipAuthentication();
    } else {
      localStorage.setItem('skipAuth', 'true')
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Bot size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to AI Chat Assistant
          </h1>
          <p className="text-gray-600">
            Sign in to save your chat history and get personalized recommendations
          </p>
        </div>

        {/* Offline Mode Notice */}
        {!isSupabaseConfigured && (
          <div className="mb-6 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <div className="flex items-center">
              <span className="text-yellow-600 mr-2">⚠️</span>
              <div>
                <p className="text-sm font-medium text-yellow-800">Development Mode</p>
                <p className="text-xs text-yellow-700">Database not configured. Use "Skip Authentication" to test the chat features.</p>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Features:</h3>
          <div className="space-y-3">
            <div className="flex items-center text-gray-600">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              Chat with AI powered by Gemini
            </div>
            <div className="flex items-center text-gray-600">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
              Upload and analyze images
            </div>
            <div className="flex items-center text-gray-600">
              <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
              Save chat history across sessions
            </div>
            <div className="flex items-center text-gray-600">
              <span className="w-2 h-2 bg-orange-600 rounded-full mr-3"></span>
              Get personalized learning recommendations
            </div>
          </div>
        </div>

        {/* Login Buttons */}
        <div className="space-y-3">
          {/* Email Authentication */}
          <button
            onClick={() => setShowEmailAuth(true)}
            disabled={!isSupabaseConfigured}
            className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
              isSupabaseConfigured 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Mail size={20} className="mr-3" />
            <span>Continue with Email</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading === 'google' || !isSupabaseConfigured}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Chrome className="w-5 h-5 mr-3 text-blue-500" />
            {loading === 'google' ? 'Signing in...' : 'Continue with Google'}
          </button>

          <button
            onClick={handleGitHubLogin}
            disabled={loading === 'github' || !isSupabaseConfigured}
            className={`w-full flex items-center justify-center px-4 py-3 rounded-lg transition-colors ${
              isSupabaseConfigured 
                ? 'bg-gray-900 text-white hover:bg-gray-800' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading === 'github' ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-white rounded-full animate-spin mr-3"></div>
            ) : (
              <Github size={20} className={`mr-3 ${isSupabaseConfigured ? 'text-white' : 'text-gray-400'}`} />
            )}
            <span className="font-medium">
              {loading === 'github' ? 'Signing in...' : 'Continue with GitHub'}
            </span>
          </button>
        </div>

        {/* Skip Auth for Testing */}
        <div className="mt-4">
          <button
            onClick={handleSkipAuth}
            className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Skip Authentication (Testing)
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to save your chat sessions securely. 
            We only store your chat history and user profile information.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
