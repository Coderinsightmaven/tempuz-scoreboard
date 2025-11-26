import React from 'react';
import { ComponentType, ScoreboardComponent } from '../../../types/scoreboard';

interface ComponentsListProps {
  /** All components in the scoreboard */
  components: ScoreboardComponent[];
  /** Callback when a component is selected */
  onSelectComponent: (componentId: string) => void;
  /** Callback when a component is deleted */
  onDeleteComponent: (componentId: string) => void;
  /** Callback when component visibility is toggled */
  onToggleVisibility: (componentId: string) => void;
  /** Callback to clear selection */
  onClearSelection: () => void;
  /** Callback to delete all components */
  onDeleteAll: () => void;
}

/**
 * ComponentsList displays a list of all components in the scoreboard.
 * 
 * Features:
 * - Sorted by zIndex (background components first)
 * - Shows component type, position, size, and z-index
 * - Allows selecting, deleting, and toggling visibility
 * - Bulk actions (clear selection, delete all)
 */
export const ComponentsList: React.FC<ComponentsListProps> = ({
  components,
  onSelectComponent,
  onDeleteComponent,
  onToggleVisibility,
  onClearSelection,
  onDeleteAll,
}) => {
  // Sort components by zIndex (background components first), then by creation order
  const sortedComponents = [...components].sort((a, b) => {
    const zIndexDiff = (a.zIndex || 0) - (b.zIndex || 0);
    if (zIndexDiff !== 0) return zIndexDiff;
    return a.id.localeCompare(b.id);
  });

  /**
   * Gets a human-readable name for a component type.
   */
  const getComponentTypeName = (type: ComponentType): string => {
    switch (type) {
      case ComponentType.BACKGROUND:
        return 'Background';
      case ComponentType.LOGO:
        return 'Logo';
      case ComponentType.TEXT:
        return 'Text';
      case ComponentType.TENNIS_PLAYER_NAME:
        return 'Tennis Player Name';
      case ComponentType.TENNIS_DOUBLES_PLAYER_NAME:
        return 'Tennis Doubles Player Name';
      case ComponentType.TENNIS_TEAM_NAMES:
        return 'Tennis Team Names';
      case ComponentType.TENNIS_ADAPTIVE_TEAM_DISPLAY:
        return 'Tennis Adaptive Team Display';
      case ComponentType.TENNIS_GAME_SCORE:
        return 'Tennis Game Score';
      case ComponentType.TENNIS_SET_SCORE:
        return 'Tennis Set Score';
      case ComponentType.TENNIS_MATCH_SCORE:
        return 'Tennis Match Score';
      case ComponentType.TENNIS_DETAILED_SET_SCORE:
        return 'Tennis Detailed Set Score';
      case ComponentType.TENNIS_SERVING_INDICATOR:
        return 'Tennis Serving Indicator';
      default:
        return 'Unknown';
    }
  };

  /**
   * Gets an emoji icon for a component type.
   */
  const getComponentIcon = (type: ComponentType): string => {
    switch (type) {
      case ComponentType.BACKGROUND:
        return '🖼️';
      case ComponentType.LOGO:
        return '🏷️';
      case ComponentType.TEXT:
        return '📝';
      case ComponentType.TENNIS_PLAYER_NAME:
        return '👤';
      case ComponentType.TENNIS_DOUBLES_PLAYER_NAME:
        return '👥';
      case ComponentType.TENNIS_TEAM_NAMES:
      case ComponentType.TENNIS_ADAPTIVE_TEAM_DISPLAY:
        return '🏷️';
      case ComponentType.TENNIS_GAME_SCORE:
      case ComponentType.TENNIS_SET_SCORE:
      case ComponentType.TENNIS_MATCH_SCORE:
      case ComponentType.TENNIS_DETAILED_SET_SCORE:
      case ComponentType.TENNIS_SERVING_INDICATOR:
        return '🎾';
      default:
        return '❓';
    }
  };

  /**
   * Gets display text for a component (shows text content or type-specific info).
   */
  const getComponentDisplayText = (component: ScoreboardComponent): string => {
    if (component.data.text) {
      return component.data.text.length > 20 
        ? component.data.text.substring(0, 20) + '...'
        : component.data.text;
    }
    
    switch (component.type) {
      case ComponentType.TENNIS_PLAYER_NAME:
        return `Player ${component.data.playerNumber || 1}`;
      case ComponentType.TENNIS_DOUBLES_PLAYER_NAME:
        const playerNum = component.data.playerNumber || 1;
        if (playerNum === 1 || playerNum === 2) return 'Smith / Johnson';
        if (playerNum === 3 || playerNum === 4) return 'Williams / Brown';
        return 'Smith / Johnson';
      case ComponentType.TENNIS_ADAPTIVE_TEAM_DISPLAY:
        const teamSelection = component.data.teamSelection || 0;
        if (teamSelection === 1) return 'Team 1';
        if (teamSelection === 2) return 'Team 2';
        return 'Team 1 / Smith vs Team 2 / Johnson';
      case ComponentType.TENNIS_GAME_SCORE:
      case ComponentType.TENNIS_SET_SCORE:
      case ComponentType.TENNIS_MATCH_SCORE:
        return `Player ${component.data.playerNumber || 1} Score`;
      case ComponentType.TENNIS_DETAILED_SET_SCORE:
        return 'Sets Score (e.g., 6-4, 5-7, 7-5)';
      case ComponentType.TENNIS_SERVING_INDICATOR:
        return `Player ${component.data.playerNumber || 1} Serving`;
      default:
        return 'No text';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b border-gray-200 pb-3">
        <h3 className="text-lg font-medium text-gray-900">
          Components ({components.length})
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Click a component to edit its properties
        </p>
      </div>

      {/* Components List */}
      {components.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No components added yet</p>
          <p className="text-gray-400 text-xs mt-1">Add components from the left sidebar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedComponents.map((component, index) => (
            <div
              key={component.id}
              className="group bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg p-3 cursor-pointer transition-colors"
              onClick={() => onSelectComponent(component.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  {/* Component Icon */}
                  <div className="text-lg flex-shrink-0">
                    {getComponentIcon(component.type)}
                  </div>
                  
                  {/* Component Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {getComponentTypeName(component.type)}
                      </h4>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                        {index + 1}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {getComponentDisplayText(component)}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                      <span>
                        📍 {Math.round(component.position.x)}, {Math.round(component.position.y)}
                      </span>
                      <span>
                        📏 {Math.round(component.size.width)}×{Math.round(component.size.height)}
                      </span>
                      <span>
                        🔢 z: {component.zIndex || 0}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(component.id);
                    }}
                    className={`p-1 rounded hover:bg-gray-200 ${!component.visible ? 'text-gray-400' : 'text-gray-600'}`}
                    title={component.visible ? 'Hide component' : 'Show component'}
                  >
                    {component.visible ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m6.121-6.121a3 3 0 11-4.243 4.243m4.243-4.243L21 21" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this component?')) {
                        onDeleteComponent(component.id);
                      }
                    }}
                    className="p-1 rounded hover:bg-red-100 text-red-600"
                    title="Delete component"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Hidden Component Indicator */}
              {!component.visible && (
                <div className="mt-2 text-xs text-gray-500 italic">
                  🚫 Hidden
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bulk Actions */}
      {components.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="text-xs text-gray-500 mb-2">Bulk Actions</div>
          <div className="flex space-x-2">
            <button
              onClick={onClearSelection}
              className="flex-1 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              Clear Selection
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete all ${components.length} components?`)) {
                  onDeleteAll();
                }
              }}
              className="flex-1 px-3 py-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
            >
              Delete All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
