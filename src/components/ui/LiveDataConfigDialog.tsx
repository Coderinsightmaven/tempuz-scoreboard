// src/components/ui/LiveDataConfigDialog.tsx
import React, { useState, useEffect } from 'react';
import { useLiveDataStore } from '../../stores/useLiveDataStore';
import { TauriAPI, MatchInfo } from '../../lib/tauri';
import { LiveDataConnection } from '../../types/scoreboard';

interface LiveDataConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingConnection?: LiveDataConnection | null;
}

export const LiveDataConfigDialog: React.FC<LiveDataConfigDialogProps> = ({
  isOpen,
  onClose,
  editingConnection,
}) => {
  const { addConnection, updateConnection } = useLiveDataStore();
  
  const [formData, setFormData] = useState({
    name: '',
    provider: 'custom_api' as const,
    apiUrl: '',
    apiKey: '',
    pollInterval: 30,
  });
  
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<'success' | 'error' | null>(null);
  const [testError, setTestError] = useState('');
  const [availableMatches, setAvailableMatches] = useState<MatchInfo[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  useEffect(() => {
    if (editingConnection) {
      setFormData({
        name: editingConnection.name,
        provider: editingConnection.provider,
        apiUrl: editingConnection.apiUrl,
        apiKey: editingConnection.apiKey,
        pollInterval: editingConnection.pollInterval,
      });
    } else {
      setFormData({
        name: '',
        provider: 'custom_api',
        apiUrl: '',
        apiKey: '',
        pollInterval: 30,
      });
    }
    setConnectionTestResult(null);
    setTestError('');
    setAvailableMatches([]);
  }, [editingConnection, isOpen]);

  const handleTestConnection = async () => {
    if (!formData.apiUrl || !formData.apiKey) {
      setTestError('Please enter both API URL and API Key');
      setConnectionTestResult('error');
      return;
    }

    setIsTestingConnection(true);
    setConnectionTestResult(null);
    setTestError('');

    try {
      const result = await TauriAPI.testApiConnection(formData.apiUrl, formData.apiKey);
      if (result) {
        setConnectionTestResult('success');
        // If test successful, try to load available matches
        await loadAvailableMatches();
      } else {
        setConnectionTestResult('error');
        setTestError('Connection test failed');
      }
    } catch (error) {
      setConnectionTestResult('error');
      setTestError(error instanceof Error ? error.message : 'Connection test failed');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const loadAvailableMatches = async () => {
    if (!formData.apiUrl || !formData.apiKey) return;

    setIsLoadingMatches(true);
    try {
      const matches = await TauriAPI.getAvailableMatches(formData.apiUrl, formData.apiKey);
      setAvailableMatches(matches);
    } catch (error) {
      console.error('Failed to load matches:', error);
      // Don't show error for matches as it's optional
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields based on provider type
    if (!formData.name) {
      alert('Please enter a connection name');
      return;
    }
    
    if (formData.provider !== 'manual_tennis' && (!formData.apiUrl || !formData.apiKey)) {
      alert('Please fill in API URL and API Key');
      return;
    }

    if (editingConnection) {
      updateConnection(editingConnection.id, formData);
    } else {
      addConnection(formData);
    }
    
    onClose();
  };

  const handlePresetSelect = (preset: 'mock' | 'tennis_api' | 'manual_tennis') => {
    switch (preset) {
      case 'mock':
        setFormData(prev => ({
          ...prev,
          provider: 'mock',
          apiUrl: 'https://api.mock-tennis.com/live',
          apiKey: 'mock_api_key_12345',
        }));
        break;
      case 'tennis_api':
        setFormData(prev => ({
          ...prev,
          provider: 'tennis_api',
          apiUrl: 'https://api.tennis-live.com/v1/matches',
          apiKey: '',
        }));
        break;
      case 'manual_tennis':
        setFormData(prev => ({
          ...prev,
          provider: 'manual_tennis',
          apiUrl: '', // Not used for manual tennis
          apiKey: '', // Not used for manual tennis
          pollInterval: 1, // Update every second for responsive manual scoring
        }));
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editingConnection ? 'Edit Live Data Connection' : 'Add Live Data Connection'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Setup
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handlePresetSelect('mock')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Mock Data (Testing)
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('tennis_api')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                Tennis API
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('manual_tennis')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm"
              >
                Manual Tennis
              </button>
            </div>
          </div>

          {/* Connection Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Connection Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g., Wimbledon Live Scores"
              required
            />
          </div>

          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Provider
            </label>
            <select
              value={formData.provider}
              onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="custom_api">Custom API</option>
              <option value="tennis_api">Tennis API Service</option>
              <option value="mock">Mock Data (Testing)</option>
              <option value="manual_tennis">Manual Tennis Scoring</option>
            </select>
          </div>

          {/* API URL - Hidden for manual tennis */}
          {formData.provider !== 'manual_tennis' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API URL *
              </label>
              <input
                type="url"
                value={formData.apiUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, apiUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="https://api.example.com/tennis/live"
                required
              />
            </div>
          )}

          {/* API Key - Hidden for manual tennis */}
          {formData.provider !== 'manual_tennis' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key *
              </label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Your API key"
                required
              />
            </div>
          )}

          {/* Manual Tennis Info */}
          {formData.provider === 'manual_tennis' && (
            <div className="bg-emerald-50 dark:bg-emerald-900 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="font-medium text-emerald-800 dark:text-emerald-200">Manual Tennis Scoring</h4>
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                This connection will pull data from the manual tennis scoring interface. 
                Use the Tennis Scoring button in the main app to input scores manually.
              </p>
            </div>
          )}

          {/* Poll Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Update Interval (seconds)
            </label>
            <input
              type="number"
              min="5"
              max="300"
              value={formData.pollInterval}
              onChange={(e) => setFormData(prev => ({ ...prev, pollInterval: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Test Connection */}
          <div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTestingConnection || !formData.apiUrl || !formData.apiKey}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isTestingConnection ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Testing Connection...
                </>
              ) : (
                'Test Connection'
              )}
            </button>

            {/* Connection Test Result */}
            {connectionTestResult && (
              <div className={`mt-2 p-2 rounded-md text-sm ${
                connectionTestResult === 'success' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                  : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
              }`}>
                {connectionTestResult === 'success' ? (
                  '✓ Connection successful!'
                ) : (
                  `✗ Connection failed: ${testError}`
                )}
              </div>
            )}
          </div>

          {/* Available Matches */}
          {availableMatches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Available Matches
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md dark:border-gray-600">
                {availableMatches.map((match, index) => (
                  <div key={index} className="p-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {match.player1Name} vs {match.player2Name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {match.tournament} - {match.round} ({match.status})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoadingMatches && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              Loading available matches...
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingConnection ? 'Update Connection' : 'Add Connection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};