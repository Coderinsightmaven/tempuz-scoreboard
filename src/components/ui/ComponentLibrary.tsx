import React from 'react';
import { ComponentType } from '../../types/scoreboard';

interface ComponentLibraryProps {
  /**
   * Callback function called when a component type is selected.
   * Receives the component type and default position.
   */
  onAddComponent: (type: ComponentType, position: { x: number; y: number }) => void;
}

/**
 * ComponentLibrary displays all available component types in a sidebar.
 * Users can click on any component type to add it to the canvas.
 * 
 * Component categories:
 * - Static components (Background, Logo, Text, Video)
 * - Tennis Live Data components (player names, scores, etc.)
 * - Individual Set Score components (for each set and player)
 * - Individual Set components (combined set scores)
 */
export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ onAddComponent }) => {
  return (
    <div className="w-64 bg-gray-100 border-r border-gray-200 p-4 flex flex-col">
      <h3 className="font-medium mb-4 flex-shrink-0">Components</h3>
      <div className="space-y-2 overflow-y-auto flex-1 scrollbar-thin">
        {/* Static Components */}
        <button
          onClick={() => onAddComponent(ComponentType.BACKGROUND, { x: 100, y: 100 })}
          className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
        >
          <div className="font-medium">BACKGROUND</div>
          <div className="text-sm text-gray-600">
            Add a background image (behind all components)
          </div>
        </button>
        <button
          onClick={() => onAddComponent(ComponentType.LOGO, { x: 100, y: 100 })}
          className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
        >
          <div className="font-medium">LOGO</div>
          <div className="text-sm text-gray-600">
            Add a logo image (scalable and resizable)
          </div>
        </button>
        <button
          onClick={() => onAddComponent(ComponentType.TEXT, { x: 100, y: 100 })}
          className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
        >
          <div className="font-medium">TEXT</div>
          <div className="text-sm text-gray-600">
            Add a text overlay
          </div>
        </button>
        <button
          onClick={() => onAddComponent(ComponentType.VIDEO, { x: 100, y: 100 })}
          className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
        >
          <div className="font-medium">VIDEO</div>
          <div className="text-sm text-gray-600">
            Add a video player component
          </div>
        </button>
        
        {/* Tennis Live Data Components */}
        <div className="pt-4 border-t border-gray-300">
          <h4 className="font-medium mb-2 text-sm text-gray-700">Tennis Live Data</h4>
          <button
            onClick={() => onAddComponent(ComponentType.TENNIS_PLAYER_NAME, { x: 100, y: 100 })}
            className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-2"
          >
            <div className="font-medium text-sm">PLAYER NAME</div>
            <div className="text-xs text-gray-600">
              Live player name display
            </div>
          </button>
          <button
            onClick={() => onAddComponent(ComponentType.TENNIS_DOUBLES_PLAYER_NAME, { x: 100, y: 100 })}
            className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-2"
          >
            <div className="font-medium text-sm">DOUBLES PLAYER NAME</div>
            <div className="text-xs text-gray-600">
              Live doubles team display (Lastname / Lastname)
            </div>
          </button>
          <button
            onClick={() => onAddComponent(ComponentType.TENNIS_TEAM_NAMES, { x: 100, y: 100 })}
            className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-2"
          >
            <div className="font-medium text-sm">TEAM NAMES</div>
            <div className="text-xs text-gray-600">
              Team names from websocket data (e.g., "Georgia vs Cal")
            </div>
          </button>
          <button
            onClick={() => onAddComponent(ComponentType.TENNIS_ADAPTIVE_TEAM_DISPLAY, { x: 100, y: 100 })}
            className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-2"
          >
            <div className="font-medium text-sm">ADAPTIVE TEAM DISPLAY</div>
            <div className="text-xs text-gray-600">
              School names for doubles, school names - last names for singles
            </div>
          </button>
          <button
            onClick={() => onAddComponent(ComponentType.TENNIS_GAME_SCORE, { x: 100, y: 100 })}
            className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-2"
          >
            <div className="font-medium text-sm">GAME SCORE</div>
            <div className="text-xs text-gray-600">
              Live game points (0, 15, 30, 40)
            </div>
          </button>
          <button
            onClick={() => onAddComponent(ComponentType.TENNIS_SET_SCORE, { x: 100, y: 100 })}
            className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-2"
          >
            <div className="font-medium text-sm">SET SCORE</div>
            <div className="text-xs text-gray-600">
              Live set score (games won)
            </div>
          </button>
          <button
            onClick={() => onAddComponent(ComponentType.TENNIS_MATCH_SCORE, { x: 100, y: 100 })}
            className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-2"
          >
            <div className="font-medium text-sm">MATCH SCORE</div>
            <div className="text-xs text-gray-600">
              Live match score (sets won)
            </div>
          </button>
          <button
            onClick={() => onAddComponent(ComponentType.TENNIS_DETAILED_SET_SCORE, { x: 100, y: 100 })}
            className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-sm">DETAILED SET SCORE</div>
            <div className="text-xs text-gray-600">
              Individual set score for specific player and set
            </div>
          </button>
          <button
            onClick={() => onAddComponent(ComponentType.TENNIS_SERVING_INDICATOR, { x: 100, y: 100 })}
            className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-sm">SERVING INDICATOR</div>
            <div className="text-xs text-gray-600">
              Shows which player is serving
            </div>
          </button>
        </div>

        {/* Individual Set Score Components */}
        <div className="pt-4 border-t border-gray-300">
          <h4 className="font-medium mb-2 text-sm text-gray-700">Individual Set Scores</h4>

          {/* Set 1 Components */}
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-600 mb-1">Set 1 Scores</div>
            <button
              onClick={() => onAddComponent(ComponentType.PLAYER1_SET1, { x: 100, y: 100 })}
              className="w-full text-left p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-1"
            >
              <div className="font-medium text-xs">PLAYER 1 SET 1</div>
              <div className="text-xs text-gray-500">Player 1's games in set 1</div>
            </button>
            <button
              onClick={() => onAddComponent(ComponentType.PLAYER2_SET1, { x: 100, y: 100 })}
              className="w-full text-left p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-xs">PLAYER 2 SET 1</div>
              <div className="text-xs text-gray-500">Player 2's games in set 1</div>
            </button>
          </div>

          {/* Set 2 Components */}
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-600 mb-1">Set 2 Scores</div>
            <button
              onClick={() => onAddComponent(ComponentType.PLAYER1_SET2, { x: 100, y: 100 })}
              className="w-full text-left p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-1"
            >
              <div className="font-medium text-xs">PLAYER 1 SET 2</div>
              <div className="text-xs text-gray-500">Player 1's games in set 2</div>
            </button>
            <button
              onClick={() => onAddComponent(ComponentType.PLAYER2_SET2, { x: 100, y: 100 })}
              className="w-full text-left p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-xs">PLAYER 2 SET 2</div>
              <div className="text-xs text-gray-500">Player 2's games in set 2</div>
            </button>
          </div>

          {/* Set 3 Components */}
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-600 mb-1">Set 3 Scores</div>
            <button
              onClick={() => onAddComponent(ComponentType.PLAYER1_SET3, { x: 100, y: 100 })}
              className="w-full text-left p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-1"
            >
              <div className="font-medium text-xs">PLAYER 1 SET 3</div>
              <div className="text-xs text-gray-500">Player 1's games in set 3</div>
            </button>
            <button
              onClick={() => onAddComponent(ComponentType.PLAYER2_SET3, { x: 100, y: 100 })}
              className="w-full text-left p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-xs">PLAYER 2 SET 3</div>
              <div className="text-xs text-gray-500">Player 2's games in set 3</div>
            </button>
          </div>

          {/* Set 4 Components */}
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-600 mb-1">Set 4 Scores</div>
            <button
              onClick={() => onAddComponent(ComponentType.PLAYER1_SET4, { x: 100, y: 100 })}
              className="w-full text-left p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-1"
            >
              <div className="font-medium text-xs">PLAYER 1 SET 4</div>
              <div className="text-xs text-gray-500">Player 1's games in set 4</div>
            </button>
            <button
              onClick={() => onAddComponent(ComponentType.PLAYER2_SET4, { x: 100, y: 100 })}
              className="w-full text-left p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-xs">PLAYER 2 SET 4</div>
              <div className="text-xs text-gray-500">Player 2's games in set 4</div>
            </button>
          </div>

          {/* Set 5 Components */}
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-600 mb-1">Set 5 Scores</div>
            <button
              onClick={() => onAddComponent(ComponentType.PLAYER1_SET5, { x: 100, y: 100 })}
              className="w-full text-left p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-1"
            >
              <div className="font-medium text-xs">PLAYER 1 SET 5</div>
              <div className="text-xs text-gray-500">Player 1's games in set 5</div>
            </button>
            <button
              onClick={() => onAddComponent(ComponentType.PLAYER2_SET5, { x: 100, y: 100 })}
              className="w-full text-left p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-xs">PLAYER 2 SET 5</div>
              <div className="text-xs text-gray-500">Player 2's games in set 5</div>
            </button>
          </div>
        </div>

        {/* Individual Set Components */}
        <div className="pt-4 border-t border-gray-300">
          <h4 className="font-medium mb-2 text-sm text-gray-700">Individual Sets</h4>

          <button
            onClick={() => onAddComponent(ComponentType.TENNIS_SET_1, { x: 100, y: 100 })}
            className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-2"
          >
            <div className="font-medium text-sm">SET 1 SCORE</div>
            <div className="text-xs text-gray-600">
              Combined score for set 1 (e.g., "6-4")
            </div>
          </button>
          <button
            onClick={() => onAddComponent(ComponentType.TENNIS_SET_2, { x: 100, y: 100 })}
            className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-2"
          >
            <div className="font-medium text-sm">SET 2 SCORE</div>
            <div className="text-xs text-gray-600">
              Combined score for set 2 (e.g., "4-6")
            </div>
          </button>
          <button
            onClick={() => onAddComponent(ComponentType.TENNIS_SET_3, { x: 100, y: 100 })}
            className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-2"
          >
            <div className="font-medium text-sm">SET 3 SCORE</div>
            <div className="text-xs text-gray-600">
              Combined score for set 3 (e.g., "6-3")
            </div>
          </button>
          <button
            onClick={() => onAddComponent(ComponentType.TENNIS_SET_4, { x: 100, y: 100 })}
            className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors mb-2"
          >
            <div className="font-medium text-sm">SET 4 SCORE</div>
            <div className="text-xs text-gray-600">
              Combined score for set 4
            </div>
          </button>
          <button
            onClick={() => onAddComponent(ComponentType.TENNIS_SET_5, { x: 100, y: 100 })}
            className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-sm">SET 5 SCORE</div>
            <div className="text-xs text-gray-600">
              Combined score for set 5
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
