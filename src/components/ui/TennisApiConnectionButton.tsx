import React, { useState } from 'react';
import { useLiveDataStore } from '../../stores/useLiveDataStore';

export const TennisApiConnectionButton: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [apiUrl, setApiUrl] = useState('http://localhost:3000');
  const [apiKey, setApiKey] = useState('dev-api-key-12345');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if auto-connection is in progress
  const isAutoConnecting = () => {
    return localStorage.getItem('tennisApiAutoConnecting') === 'true';
  };

  const {
    connectToTennisApi,
    disconnectFromTennisApi,
    tennisApiConnected,
    lastError,
    clearError,
  } = useLiveDataStore();

  const handleConnect = async () => {
    if (!apiUrl.trim() || !apiKey.trim()) {
      setError('Please enter both API URL and API Key');
      return;
    }

    setLoading(true);
    setError(null);
    clearError();

    try {
      // Connect to WebSocket - this will automatically fetch scoreboards
      connectToTennisApi(apiUrl, apiKey);
      setShowDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnectFromTennisApi();
    setError(null);
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
          tennisApiConnected
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : isAutoConnecting()
            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
        title={
          tennisApiConnected
            ? 'Tennis API Connected'
            : isAutoConnecting()
            ? 'Auto-connecting to Tennis API...'
            : 'Connect to Tennis API'
        }
      >
        <svg className={`w-4 h-4 ${isAutoConnecting() ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isAutoConnecting() ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          )}
        </svg>
        <span>
          {tennisApiConnected
            ? '🎾 API Connected'
            : isAutoConnecting()
            ? '🎾 Auto-connecting...'
            : '🎾 Connect API'
          }
        </span>
      </button>

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  🎾 Tennis API Connection
                </h2>
                <button
                  onClick={() => setShowDialog(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {tennisApiConnected ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <p className="text-green-800 dark:text-green-200 font-medium">
                        Successfully connected to Tennis API
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleDisconnect}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Disconnect
                    </button>
                    <button
                      onClick={() => setShowDialog(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      API URL
                    </label>
                    <input
                      type="text"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="http://localhost:3000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="dev-api-key-12345"
                    />
                  </div>

                  {(error || lastError) && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                      <p className="text-sm text-red-800 dark:text-red-200">
                        ❌ {error || lastError}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={handleConnect}
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      {loading ? 'Connecting...' : 'Connect'}
                    </button>
                    <button
                      onClick={() => setShowDialog(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  📋 Instructions
                </h3>
                <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Start your tennis-api server: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">cd tennis-api && yarn start:dev</code></li>
                  <li>Enter the API URL (usually http://localhost:3000)</li>
                  <li>Enter your API key (default: dev-api-key-12345)</li>
                  <li>Click "Connect" to establish WebSocket connection</li>
                  <li>The connection will automatically fetch available scoreboards</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
