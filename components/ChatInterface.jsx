'use client';

import { chatAPI } from '@/lib/api';
import { useState, useRef, useEffect } from 'react';
import { Send, Image, X, ExternalLink, Clock, Tag, BookOpen, Menu, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { saveChatSession, updateChatSession, getChatSession } from '@/lib/supabase';
import ChatHistorySidebar from './ChatHistorySidebar';
import UserMenu from './UserMenu';

const ChatInterface = () => {
  let user = null;
  try {
    const auth = useAuth();
    user = auth?.user;
  } catch (error) {
    console.log('Auth context not available, running without authentication');
  }
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [showChatHistory, setShowChatHistory] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentSessionTitle, setCurrentSessionTitle] = useState('New Chat');
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        saveCurrentSession();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [messages, user]);

  const generateChatTitle = (messages) => {
    const firstUserMessage = messages.find(m => m.role === 'user' && m.content.trim());
    if (firstUserMessage) {
      const title = firstUserMessage.content.trim();
      return title.length > 50 ? title.substring(0, 50) + '...' : title;
    }
    return 'New Chat';
  };

  const saveCurrentSession = async () => {
    if (!user || messages.length === 0) return;

    try {
      const title = currentSessionTitle === 'New Chat' ? generateChatTitle(messages) : currentSessionTitle;
      
      if (currentSessionId) {
        await updateChatSession(currentSessionId, title, messages);
      } else {
        const { data, error } = await saveChatSession(user.id, title, messages);
        if (data && !error) {
          setCurrentSessionId(data.id);
          setCurrentSessionTitle(title);
        }
      }
    } catch (error) {
      console.error('Error saving chat session:', error);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setRecommendations([]);
    setCurrentSessionId(null);
    setCurrentSessionTitle('New Chat');
    removeImage();
  };

  const loadChatSession = async (session) => {
    try {
      setMessages(session.messages || []);
      setCurrentSessionId(session.id);
      setCurrentSessionTitle(session.title);
      
      const lastAiMessage = (session.messages || []).reverse().find(m => m.role === 'assistant' && m.recommendations);
      if (lastAiMessage) {
        setRecommendations(lastAiMessage.recommendations);
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  };

  const renameChatSession = async (sessionId, newTitle) => {
    try {
      await updateChatSession(sessionId, newTitle, messages);
      if (sessionId === currentSessionId) {
        setCurrentSessionTitle(newTitle);
      }
    } catch (error) {
      console.error('Error renaming chat session:', error);
      throw error;
    }
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !selectedImage) || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
      hasImage: !!selectedImage,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const currentInput = inputMessage;
    setInputMessage('');
    removeImage();

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      let response;
      if (selectedImage) {
        response = await chatAPI.sendMessageWithImage(
          currentInput,
          selectedImage,
          conversationHistory
        );
      } else {
        response = await chatAPI.sendMessage(currentInput, conversationHistory);
      }

      const contextualRecommendations = generateContextualRecommendations(currentInput, response.response);
      const finalRecommendations = [...(response.recommendations || []), ...contextualRecommendations];

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
        recommendations: finalRecommendations,
      };

      setMessages(prev => [...prev, aiMessage]);
      setRecommendations(finalRecommendations);
    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 429) {
          errorMessage = 'API rate limit exceeded. Please wait a moment and try again.';
        } else if (status === 500 && data?.message) {
          errorMessage = `Server error: ${data.message}`;
        } else if (data?.error) {
          errorMessage = data.error;
        }
        
        console.error('Server error details:', data);
      } else if (error.request) {
        errorMessage = 'Unable to connect to the server. Please check if the backend is running on port 5000.';
        console.error('Network error - backend may not be running');
      }
      
      const errorMessageObj = {
        id: Date.now() + 1,
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateContextualRecommendations = (userInput, aiResponse) => {
    const recommendations = [];
    const input = userInput.toLowerCase();
    const response = aiResponse.toLowerCase();

    if (input.includes('javascript') || input.includes('js') || response.includes('javascript')) {
      recommendations.push({
        id: `rec_js_${Date.now()}`,
        title: 'JavaScript Fundamentals Course',
        description: 'Master JavaScript basics with interactive exercises and real-world projects.',
        url: 'https://javascript.info/',
        type: 'course',
        difficulty: 'beginner',
        estimatedTime: '20 hours',
        tags: ['javascript', 'web development', 'programming']
      });
    }

    if (input.includes('react') || response.includes('react')) {
      recommendations.push({
        id: `rec_react_${Date.now()}`,
        title: 'React Official Documentation',
        description: 'Learn React from the official docs with hands-on examples.',
        url: 'https://react.dev/',
        type: 'tutorial',
        difficulty: 'intermediate',
        estimatedTime: '15 hours',
        tags: ['react', 'frontend', 'components']
      });
    }

    if (input.includes('python') || response.includes('python')) {
      recommendations.push({
        id: `rec_python_${Date.now()}`,
        title: 'Python for Beginners',
        description: 'Start your Python journey with this comprehensive beginner guide.',
        url: 'https://www.python.org/about/gettingstarted/',
        type: 'course',
        difficulty: 'beginner',
        estimatedTime: '25 hours',
        tags: ['python', 'programming', 'basics']
      });
    }

    if (input.includes('machine learning') || input.includes('ai') || response.includes('machine learning')) {
      recommendations.push({
        id: `rec_ml_${Date.now()}`,
        title: 'Machine Learning Crash Course',
        description: 'Google\'s fast-paced, practical introduction to machine learning.',
        url: 'https://developers.google.com/machine-learning/crash-course',
        type: 'course',
        difficulty: 'intermediate',
        estimatedTime: '15 hours',
        tags: ['machine learning', 'ai', 'tensorflow']
      });
    }

    if (input.includes('database') || input.includes('sql') || response.includes('database')) {
      recommendations.push({
        id: `rec_sql_${Date.now()}`,
        title: 'SQL Tutorial',
        description: 'Learn SQL with interactive exercises and real database examples.',
        url: 'https://www.w3schools.com/sql/',
        type: 'tutorial',
        difficulty: 'beginner',
        estimatedTime: '10 hours',
        tags: ['sql', 'database', 'queries']
      });
    }

    if (input.includes('web development') || input.includes('html') || input.includes('css')) {
      recommendations.push({
        id: `rec_web_${Date.now()}`,
        title: 'MDN Web Docs',
        description: 'The most comprehensive web development resource for developers.',
        url: 'https://developer.mozilla.org/',
        type: 'article',
        difficulty: 'beginner',
        estimatedTime: '5 hours',
        tags: ['html', 'css', 'web development']
      });
    }

    return recommendations.slice(0, 3);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return '🎥';
      case 'article': return '📄';
      case 'tutorial': return '📝';
      case 'course': return '🎓';
      default: return '📚';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Chat History Sidebar - only show if authenticated */}
      {user && (
        <ChatHistorySidebar
          currentSessionId={currentSessionId}
          onNewChat={startNewChat}
          onSelectChat={loadChatSession}
          onRenameChat={renameChatSession}
          isOpen={showChatHistory}
          onToggle={() => setShowChatHistory(!showChatHistory)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {user && (
                <button
                  onClick={() => setShowChatHistory(!showChatHistory)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mr-3"
                >
                  <Menu size={20} />
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{currentSessionTitle}</h1>
                <p className="text-sm text-gray-600">Powered by Gemini AI</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {user && (
                <button
                  onClick={startNewChat}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  New
                </button>
              )}
              <button
                onClick={() => setShowRecommendations(!showRecommendations)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showRecommendations ? 'Hide' : 'Show'} Recommendations
              </button>
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Welcome to AI Chat Assistant
              </h2>
              <p className="text-gray-600 mb-4">
                Ask me anything! You can also attach images for visual analysis.
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-sm">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Text Chat
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                  Image Analysis
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                  Learning Materials
                </span>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.isError
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.hasImage && (
                  <div className="mt-2 text-xs opacity-75">
                    📷 Image attached
                  </div>
                )}
                <div className="text-xs mt-1 opacity-75">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm text-gray-600 ml-2">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          {imagePreview && (
            <div className="mb-4 relative inline-block">
              <img
                src={imagePreview}
                alt="Selected"
                className="max-w-32 max-h-32 rounded-lg border border-gray-300"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Attach Image"
            >
              <Image size={20} />
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={(!inputMessage.trim() && !selectedImage) || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>

      {/* Recommendations Sidebar */}
      {showRecommendations && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BookOpen size={20} className="mr-2" />
              Learning Materials
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Recommended resources based on our conversation
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {recommendations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📚</div>
                <p className="text-gray-600 text-sm">
                  Start a conversation to get personalized learning material recommendations!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getTypeIcon(item.type)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(item.difficulty)}`}>
                          {item.difficulty}
                        </span>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                      {item.title}
                    </h3>
                    
                    <p className="text-gray-600 text-xs mb-3">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center text-gray-500">
                        <Clock size={12} className="mr-1" />
                        {item.estimatedTime}
                      </div>
                      <div className="flex items-center">
                        <Tag size={12} className="mr-1 text-gray-400" />
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 2 && (
                            <span className="text-gray-500">+{item.tags.length - 2}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
