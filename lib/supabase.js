import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  console.log('SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing')
  console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

export const signInWithGitHub = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export const signUpWithEmail = async (email, password, fullName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  })
  return { data, error }
}

export const signInWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
  return { data, error }
}

export const saveChatSession = async (userId, title, messages) => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      title: title,
      messages: messages,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  return { data, error }
}

export const updateChatSession = async (sessionId, title, messages) => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .update({
      title: title,
      messages: messages,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .select()
    .single()
  
  return { data, error }
}

export const getChatSessions = async (userId) => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  
  return { data, error }
}

export const deleteChatSession = async (sessionId) => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId)
  
  return { data, error }
}

export const getChatSession = async (sessionId) => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()
  
  return { data, error }
}
