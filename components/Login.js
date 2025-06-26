'use client';

import { useState } from 'react'
import { signInWithGoogle, signInWithGitHub } from '@/lib/supabase'
import { Github, Chrome, Bot, Mail } from 'lucide-react'
import EmailAuth from './EmailAuth'

const Login = () => {
  const [loading, setLoading] = useState('')
  const [showEmailAuth, setShowEmailAuth] = useState(false)

  if (showEmailAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <EmailAuth onBack={() => setShowEmailAuth(false)} />
      </div>
    )
  }

  const handleGoogleLogin = async () => {
    setLoading('google')
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        console.error('Google login error:', error)
        alert('Failed to sign in with Google. Please try again.')
      }
    } catch (error) {
      console.error('Google login error:', error)
      alert('Failed to sign in with Google. Please try again.')
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
        alert('Failed to sign in with GitHub. Please try again.')
      }
    } catch (error) {
      console.error('GitHub login error:', error)
      alert('Failed to sign in with GitHub. Please try again.')
    } finally {
      setLoading('')
    }
  }

  const handleSkipAuth = () => {
    localStorage.setItem('skipAuth', 'true')
    window.location.reload()
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
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
            onClick={handleGoogleLogin}
            disabled={loading === 'google'}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'google' ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-3"></div>
            ) : (
              <Chrome size={20} className="mr-3 text-red-500" />
            )}
            <span className="font-medium text-gray-700">
              {loading === 'google' ? 'Signing in...' : 'Continue with Google'}
            </span>
          </button>

          <button
            onClick={handleGitHubLogin}
            disabled={loading === 'github'}
            className="w-full flex items-center justify-center px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'github' ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-white rounded-full animate-spin mr-3"></div>
            ) : (
              <Github size={20} className="mr-3" />
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
