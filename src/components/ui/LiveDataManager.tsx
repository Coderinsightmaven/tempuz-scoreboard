// src/components/ui/LiveDataManager.tsx
import React, { useState } from 'react';
import { useLiveDataStore } from '../../stores/useLiveDataStore';
import { LiveDataConfigDialog } from './LiveDataConfigDialog';
import { LiveDataConnection } from '../../types/scoreboard';

interface LiveDataManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveDataManager: React.FC<LiveDataManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    connections,
    activeData,
    componentBindings,
    removeConnection,
    activateConnection,
    deactivateConnection,
    createManualTennisConnection,
  } = useLiveDataStore();

  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingConnection, setEditingConnection] = useState<LiveDataConnection | null>(null);

  const handleAddConnection = () => {
    setEditingConnection(null);
    setShowConfigDialog(true);
  };

  const handleEditConnection = (connection: LiveDataConnection) => {
    setEditingConnection(connection);
    setShowConfigDialog(true);
  };

  const handleDeleteConnection = (connectionId: string) => {
    if (confirm('Are you sure you want to delete this connection? This will also remove all component bindings.')) {
      removeConnection(connectionId);
    }
  };

  const handleToggleConnection = (connection: LiveDataConnection) => {
    if (connection.isActive) {
      deactivateConnection(connection.id);
    } else {
      activateConnection(connection.id);
    }
  };

  const getConnectionStatus = (connection: LiveDataConnection) => {
    if (!connection.isActive) return 'Inactive';
    if (connection.lastError) return 'Error';
    if (activeData[connection.id]) return 'Connected';
    return 'Connecting...';
  };

  const getStatusColor = (connection: LiveDataConnection) => {
    const status = getConnectionStatus(connection);
    switch (status) {
      case 'Connected':
        return 'text-green-600 dark:text-green-400';
      case 'Error':
        return 'text-red-600 dark:text-red-400';
      case 'Connecting...':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getBoundComponentsCount = (connectionId: string) => {
    return componentBindings.filter(binding => binding.connectionId === connectionId).length;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Live Data Connections
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

          {/* Add Connection Buttons */}
          <div className="mb-6 flex space-x-4">
            <button
              onClick={handleAddConnection}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Connection</span>
            </button>
            <button
              onClick={() => createManualTennisConnection()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Quick: Manual Tennis</span>
            </button>
          </div>

          {/* Connections List */}
          {connections.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">No connections configured</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                Add a live data connection to start receiving real-time tennis scores
              </p>
              <button
                onClick={handleAddConnection}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Add Your First Connection
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((connection) => (
                <div key={connection.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {connection.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {connection.provider === 'manual_tennis' 
                          ? `${connection.provider} • Manual scoring interface` 
                          : `${connection.provider} • ${connection.apiUrl}`
                        }
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${getStatusColor(connection)}`}>
                        {getConnectionStatus(connection)}
                      </span>
                      <button
                        onClick={() => handleToggleConnection(connection)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          connection.isActive
                            ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800 dark:text-red-100'
                            : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800 dark:text-green-100'
                        }`}
                      >
                        {connection.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>

                  {/* Connection Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Update Interval:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{connection.pollInterval}s</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Bound Components:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{getBoundComponentsCount(connection.id)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {connection.lastUpdated ? new Date(connection.lastUpdated).toLocaleTimeString() : 'Never'}
                      </span>
                    </div>
                  </div>

                  {/* Error Message */}
                  {connection.lastError && (
                    <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-800 dark:bg-red-800 dark:text-red-100 dark:border-red-700">
                      <strong>Error:</strong> {connection.lastError}
                    </div>
                  )}

                  {/* Live Data Preview */}
                  {activeData[connection.id] && (
                    <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Live Data Preview</h4>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <strong>{activeData[connection.id].player1.name}</strong>
                            <div>Sets: {activeData[connection.id].score.player1Sets}</div>
                            <div>Games: {activeData[connection.id].score.player1Games}</div>
                            <div>Points: {activeData[connection.id].score.player1Points}</div>
                          </div>
                          <div>
                            <strong>{activeData[connection.id].player2.name}</strong>
                            <div>Sets: {activeData[connection.id].score.player2Sets}</div>
                            <div>Games: {activeData[connection.id].score.player2Games}</div>
                            <div>Points: {activeData[connection.id].score.player2Points}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs">
                          Status: {activeData[connection.id].matchStatus} • 
                          Set: {activeData[connection.id].currentSet} •
                          Serving: Player {activeData[connection.id].servingPlayer || 'None'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditConnection(connection)}
                      className="px-3 py-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteConnection(connection.id)}
                      className="px-3 py-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Config Dialog */}
      <LiveDataConfigDialog
        isOpen={showConfigDialog}
        onClose={() => setShowConfigDialog(false)}
        editingConnection={editingConnection}
      />
    </>
  );
};