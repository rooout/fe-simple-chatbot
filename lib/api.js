import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatAPI = {
  sendMessage: async (message, conversationHistory = []) => {
    console.log('Sending message to API:', { 
      url: `${API_BASE_URL}/api/chat`, 
      message: message.substring(0, 50) 
    });
    
    const response = await api.post('/api/chat', {
      message,
      conversationHistory,
    });
    
    console.log('Received response from API:', response.data);
    return response.data;
  },

  sendMessageWithImage: async (message, imageFile, conversationHistory = []) => {
    console.log('Sending image message to API:', { 
      message: message?.substring(0, 50) + '...', 
      imageSize: imageFile?.size,
      historyLength: conversationHistory.length 
    });
    
    const formData = new FormData();
    formData.append('message', message);
    formData.append('image', imageFile);
    formData.append('conversationHistory', JSON.stringify(conversationHistory));

    const response = await api.post('/api/chat/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Received image response from API:', response.data);
    return response.data;
  },

  getRecommendations: async (params = {}) => {
    const response = await api.get('/api/recommendations', { params });
    return response.data;
  },

  healthCheck: async () => {
    const response = await api.get('/api/health');
    return response.data;
  },
};

export default api;
