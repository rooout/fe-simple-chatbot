'use client';

import { useAuth } from '@/contexts/AuthContext'
import ChatInterface from '@/components/ChatInterface'
import Login from '@/components/Login'

const App = () => {
  let user = null;
  let loading = false;
  let authError = null;

  try {
    const auth = useAuth();
    user = auth?.user;
    loading = auth?.loading;
    authError = auth?.authError;
    
    console.log('App component - Auth state:', { user: !!user, loading, authError });
  } catch (error) {
    console.log('Auth context error:', error);
    // In local mode without proper auth setup, we can still show the login
    user = null;
    loading = false;
    authError = 'Authentication not configured';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return <ChatInterface />
}

export default App
