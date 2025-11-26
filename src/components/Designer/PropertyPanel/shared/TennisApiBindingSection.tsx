import React from 'react';
import { useLiveDataStore } from '../../../../stores/useLiveDataStore';

/**
 * TennisApiBindingSection displays information about tennis API connection status.
 * 
 * Shows:
 * - Connection status (connected/disconnected)
 * - Available scoreboards when connected
 * - Message to connect when disconnected
 */
export const TennisApiBindingSection: React.FC = () => {
  const { tennisApiConnected, getTennisApiScoreboards } = useLiveDataStore();

  if (!tennisApiConnected) {
    return (
      <div className="border-t border-gray-200 pt-4">
        <h5 className="text-sm font-medium text-gray-900 mb-2">Tennis API</h5>
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          🔌 Connect to tennis-api WebSocket to enable live data
        </div>
      </div>
    );
  }

  const scoreboards = getTennisApiScoreboards();

  return (
    <div className="border-t border-gray-200 pt-4">
      <h5 className="text-sm font-medium text-gray-900 mb-2">Tennis API</h5>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Available Scoreboards ({scoreboards.length})
          </label>
          <div className="text-xs text-gray-600">
            {scoreboards.length === 0 ? (
              'No scoreboards loaded'
            ) : (
              scoreboards.map((sb: { id: string; name: string }) => `${sb.name} (${sb.id})`).join(', ')
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
