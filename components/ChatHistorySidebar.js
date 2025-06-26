'use client';

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getChatSessions, deleteChatSession } from '@/lib/supabase'
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Edit2, 
  User, 
  LogOut,
  Calendar,
  Search
} from 'lucide-react'

const ChatHistorySidebar = ({ 
  currentSessionId, 
  onNewChat, 
  onSelectChat, 
  onRenameChat,
  isOpen,
  onToggle 
}) => {
  const { user, signOut } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => {
    if (user) {
      loadChatSessions()
    }
  }, [user])

  const loadChatSessions = async () => {
    setLoading(true)
    try {
      const { data, error } = await getChatSessions(user.id)
      if (error) {
        console.error('Error loading chat sessions:', error)
      } else {
        setSessions(data || [])
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this chat?')) {
      try {
        const { error } = await deleteChatSession(sessionId)
        if (error) {
          console.error('Error deleting session:', error)
          alert('Failed to delete chat session')
        } else {
          setSessions(sessions.filter(s => s.id !== sessionId))
          if (currentSessionId === sessionId) {
            onNewChat()
          }
        }
      } catch (error) {
        console.error('Error deleting session:', error)
        alert('Failed to delete chat session')
      }
    }
  }

  const handleRenameSession = async (sessionId, newTitle) => {
    if (newTitle.trim() && newTitle !== editTitle) {
      try {
        await onRenameChat(sessionId, newTitle.trim())
        setSessions(sessions.map(s => 
          s.id === sessionId ? { ...s, title: newTitle.trim() } : s
        ))
      } catch (error) {
        console.error('Error renaming session:', error)
      }
    }
    setEditingId(null)
    setEditTitle('')
  }

  const startEditing = (session, e) => {
    e.stopPropagation()
    setEditingId(session.id)
    setEditTitle(session.title)
  }

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const groupSessionsByDate = (sessions) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const week = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    }

    sessions.forEach(session => {
      const sessionDate = new Date(session.updated_at)
      const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate())

      if (sessionDay.getTime() === today.getTime()) {
        groups.today.push(session)
      } else if (sessionDay.getTime() === yesterday.getTime()) {
        groups.yesterday.push(session)
      } else if (sessionDate >= week) {
        groups.thisWeek.push(session)
      } else {
        groups.older.push(session)
      }
    })

    return groups
  }

  const sessionGroups = groupSessionsByDate(filteredSessions)

  const renderSessionGroup = (title, sessions) => {
    if (sessions.length === 0) return null

    return (
      <div key={title} className="mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
          {title}
        </h3>
        <div className="space-y-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectChat(session)}
              className={`group flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                currentSessionId === session.id
                  ? 'bg-blue-100 text-blue-900'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <MessageSquare size={16} className="mr-3 flex-shrink-0" />
              
              {editingId === session.id ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => handleRenameSession(session.id, editTitle)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleRenameSession(session.id, editTitle)
                    } else if (e.key === 'Escape') {
                      setEditingId(null)
                      setEditTitle('')
                    }
                  }}
                  className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(session.updated_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => startEditing(session, e)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Rename chat"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="p-1 hover:bg-red-200 rounded transition-colors text-red-600"
                  title="Delete chat"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`${isOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-4"
        >
          <Plus size={20} className="mr-2" />
          New Chat
        </button>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={32} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-sm">
              No chat history yet. Start a conversation to see your chats here!
            </p>
          </div>
        ) : (
          <div>
            {renderSessionGroup('Today', sessionGroups.today)}
            {renderSessionGroup('Yesterday', sessionGroups.yesterday)}
            {renderSessionGroup('This Week', sessionGroups.thisWeek)}
            {renderSessionGroup('Older', sessionGroups.older)}
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <User size={16} className="text-white" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {user?.user_metadata?.full_name || user?.email || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatHistorySidebar
