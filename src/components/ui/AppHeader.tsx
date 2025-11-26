import React from 'react';
import { TennisApiConnectionButton } from './TennisApiConnectionButton';

interface AppHeaderProps {
  /** Current scoreboard config (null if no scoreboard loaded) */
  config: any;
  /** Number of active scoreboard instances */
  scoreboardInstancesCount: number;
  /** Number of selected components */
  selectedComponentsCount: number;
  /** Number of components in clipboard */
  clipboardCount: number;
  /** Whether property panel is visible */
  showPropertyPanel: boolean;
  /** Callback when fit to screen button is clicked */
  onFitToScreen: () => void;
  /** Callback when save button is clicked */
  onSave: () => void;
  /** Callback when export button is clicked */
  onExport: () => void;
  /** Callback when import button is clicked */
  onImport: () => void;
  /** Callback when copy button is clicked */
  onCopy: () => void;
  /** Callback when paste button is clicked */
  onPaste: () => void;
  /** Callback when multiple scoreboard manager button is clicked */
  onShowMultipleManager: () => void;
  /** Callback when load dialog button is clicked */
  onShowLoadDialog: () => void;
  /** Callback when create dialog button is clicked */
  onShowCreateDialog: () => void;
  /** Callback when scoreboard manager button is clicked */
  onShowScoreboardManager: () => void;
  /** Callback when property panel toggle button is clicked */
  onTogglePropertyPanel: () => void;
}

/**
 * AppHeader displays the main application header with all action buttons.
 * 
 * Features:
 * - Scoreboard name and dimensions display
 * - Fit to screen button (only shown when scoreboard is loaded)
 * - Save/Export/Import buttons
 * - Copy/Paste buttons (only shown when scoreboard is loaded)
 * - Multiple scoreboard manager
 * - Load/Create/Manage scoreboard buttons
 * - Tennis API connection button
 * - Property panel toggle
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
  config,
  scoreboardInstancesCount,
  selectedComponentsCount,
  clipboardCount,
  showPropertyPanel,
  onFitToScreen,
  onSave,
  onExport,
  onImport,
  onCopy,
  onPaste,
  onShowMultipleManager,
  onShowLoadDialog,
  onShowCreateDialog,
  onShowScoreboardManager,
  onTogglePropertyPanel,
}) => {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Left side: Title and scoreboard info */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Scoreboard Designer
          </h1>
          {config && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {config.name} - {config.dimensions.width}x{config.dimensions.height}
            </span>
          )}
        </div>
        
        {/* Right side: Action buttons */}
        <div className="flex items-center space-x-2">
          {/* Fit to Screen Button - only show when config is loaded */}
          {config && (
            <button
              onClick={onFitToScreen}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
              title="Fit scoreboard to screen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span>Fit to Screen</span>
            </button>
          )}

          {/* Save/Export Buttons - only show when config is loaded */}
          {config && (
            <>
              <button
                onClick={onSave}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                title="Save current scoreboard design"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Save Design</span>
              </button>
              
              <button
                onClick={onExport}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                title="Export scoreboard with images as ZIP"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <span>Export ZIP</span>
              </button>
            </>
          )}

          {/* Import ZIP Button - always visible */}
          <button
            onClick={onImport}
            className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            title="Import scoreboard from ZIP file"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <span>Import ZIP</span>
          </button>

          {/* Copy/Paste Buttons - only show when config is loaded */}
          {config && (
            <>
              <button
                onClick={onCopy}
                disabled={selectedComponentsCount === 0}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Copy selected components (Ctrl+C)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy ({selectedComponentsCount})</span>
              </button>
              
              <button
                onClick={onPaste}
                disabled={clipboardCount === 0}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Paste components (Ctrl+V)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Paste ({clipboardCount})</span>
              </button>
            </>
          )}

          {/* Multiple Scoreboard Manager Button */}
          <button
            onClick={onShowMultipleManager}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Multiple Scoreboards ({scoreboardInstancesCount})</span>
          </button>

          <button
            onClick={onShowLoadDialog}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Load Scoreboard</span>
          </button>
          
          <button
            onClick={onShowCreateDialog}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            New Scoreboard
          </button>
          
          <button
            onClick={onShowScoreboardManager}
            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Manage Scoreboards</span>
          </button>

          <TennisApiConnectionButton />

          <button
            onClick={onTogglePropertyPanel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            title={showPropertyPanel ? 'Hide Property Panel' : 'Show Property Panel'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            <span>{showPropertyPanel ? 'Hide Properties' : 'Show Properties'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
