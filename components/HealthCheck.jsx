'use client';

import { useEffect, useState } from 'react';
import { chatAPI } from '@/lib/api';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const HealthCheck = () => {
  const [health, setHealth] = useState({
    status: 'checking',
    backend: false,
    gemini: false,
    timestamp: null
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await chatAPI.healthCheck();
        setHealth({
          status: 'healthy',
          backend: true,
          gemini: response.geminiConfigured,
          timestamp: response.timestamp
        });
      } catch (error) {
        setHealth({
          status: 'error',
          backend: false,
          gemini: false,
          timestamp: new Date().toISOString()
        });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (isHealthy) => {
    if (health.status === 'checking') {
      return <AlertCircle className="text-yellow-500" size={16} />;
    }
    return isHealthy 
      ? <CheckCircle className="text-green-500" size={16} />
      : <XCircle className="text-red-500" size={16} />;
  };

  const getStatusText = (isHealthy) => {
    if (health.status === 'checking') return 'Checking...';
    return isHealthy ? 'Online' : 'Offline';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
      <div className="text-xs font-semibold text-gray-700 mb-2">System Status</div>
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          {getStatusIcon(health.backend)}
          <span className="text-xs">Backend: {getStatusText(health.backend)}</span>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(health.gemini)}
          <span className="text-xs">Gemini AI: {getStatusText(health.gemini)}</span>
        </div>
      </div>
      {health.timestamp && (
        <div className="text-xs text-gray-500 mt-2">
          Last check: {new Date(health.timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default HealthCheck;
