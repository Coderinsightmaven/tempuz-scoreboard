/**
 * DraggableComponent - Renders a draggable scoreboard component on the canvas.
 * 
 * Features:
 * - Drag-and-drop support via @dnd-kit
 * - Resize handles (8 handles: corners and edges)
 * - Live tennis data integration
 * - Type-specific rendering (background, logo, text, video, tennis components)
 * - Selection state visualization
 * - Style application (colors, borders, fonts)
 * 
 * This component is the visual representation of a scoreboard component on the canvas.
 * It handles rendering based on component type and integrates with live data sources.
 */
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ScoreboardComponent, ComponentType } from '../../../types/scoreboard';
import { ResizeHandle } from '../../../types/canvas';
import { ResizeHandles } from './ResizeHandles';
import { ImageComponent } from './ImageComponent';
import { VideoComponent } from './VideoComponent';
import { TennisPlayerNameDisplay } from './TennisPlayerNameDisplay';
import { useCanvasStore } from '../../../stores/useCanvasStore';
import { useLiveDataStore } from '../../../stores/useLiveDataStore';
import { getRustTennisProcessor } from '../../../services/rustTennisProcessor';
import { RawTennisData } from '../../../types/tennisProcessor';

interface DraggableComponentProps {
  /** The component to render */
  component: ScoreboardComponent;
  /** Callback when component is clicked/selected */
  onSelect?: (id: string) => void;
  /** Callback when resize handle is grabbed */
  onResizeStart?: (componentId: string, handle: ResizeHandle, event: React.MouseEvent) => void;
  /** Optional tennis API scoreboard ID for filtering data in scoreboard windows */
  tennisApiScoreboardId?: string;
}

export const DraggableComponent: React.FC<DraggableComponentProps> = ({
  component,
  onSelect,
  onResizeStart,
  tennisApiScoreboardId,
}) => {
  const { selectedComponents, isResizing } = useCanvasStore();
  const isSelected = selectedComponents.has(component.id);

  /**
   * Gets live tennis data for tennis components.
   * 
   * Process:
   * 1. Checks if component is a tennis component
   * 2. Retrieves raw tennis data from live data store
   * 3. Processes data through Rust backend for performance
   * 4. Returns processed match data for rendering
   * 
   * Note: Rust processing happens asynchronously and doesn't block rendering.
   */
  const tennisMatch = component.type.startsWith('tennis_') ?
    (() => {
      const state = useLiveDataStore.getState();

      // If a specific tennis API scoreboard ID is provided (for scoreboard windows),
      // only get data from that scoreboard
      if (tennisApiScoreboardId) {
        const rawData = state.getTennisApiMatch(tennisApiScoreboardId);
        if (rawData) {
          // Process data through Rust backend
          try {
            const processor = getRustTennisProcessor({
              enableDebugLogging: import.meta.env.DEV
            });
            // Process synchronously if possible, or handle async processing
            processor.processData(rawData as RawTennisData).then(processedData => {
              console.log(`✅ Processed tennis data for ${component.id}:`, processedData.match_id);
            }).catch(error => {
              console.error(`❌ Rust processing failed for ${component.id}:`, error);
            });
          } catch (error) {
            console.error(`❌ Failed to initialize Rust processor for ${component.id}:`, error);
          }
        }
        return state.getTennisApiMatch(tennisApiScoreboardId);
      }

      // For design canvas (no specific scoreboard ID), get match by component ID
      const rawData = state.getTennisApiMatch(component.id);
      if (rawData) {
        // Process data through Rust backend
        try {
          const processor = getRustTennisProcessor({
            enableDebugLogging: import.meta.env.DEV
          });
          processor.processData(rawData as RawTennisData).then(processedData => {
            console.log(`✅ Processed tennis data for ${component.id}:`, processedData.match_id);
          }).catch(error => {
            console.error(`❌ Rust processing failed for ${component.id}:`, error);
          });
        } catch (error) {
          console.error(`❌ Failed to initialize Rust processor for ${component.id}:`, error);
        }
      }
      return rawData;
    })() : null;
  
  // Tennis data change animation disabled to prevent visual clutter

  /**
   * @dnd-kit drag configuration.
   * Sets up drag handlers and transform for drag operations.
   */
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: component.id,
    data: {
      type: 'component',
      component,
    },
  });

  /**
   * Handles resize handle mouse down events.
   * 
   * @param handle - Which resize handle was grabbed
   * @param event - Mouse event
   */
  const handleResizeStart = (handle: ResizeHandle, event: React.MouseEvent) => {
    if (onResizeStart) {
      onResizeStart(component.id, handle, event);
    }
  };

  /**
   * Renders the content of the component based on its type.
   * 
   * Component types:
   * - BACKGROUND: Background image (behind all components)
   * - LOGO: Logo image
   * - TEXT: Text overlay
   * - VIDEO: Video player
   * - Tennis components: Live tennis data displays
   * 
   * @returns JSX element for the component content
   */
  const renderComponentContent = () => {
    switch (component.type) {
      case ComponentType.BACKGROUND:
        if (!component.data.imageId) {
          return (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-sm">
              No Background Selected
            </div>
          );
        }
        return (
          <ImageComponent
            imageId={component.data.imageId}
            alt="Background Image"
            scaleMode={component.data.scaleMode || 'cover'}
          />
        );
      case ComponentType.LOGO:
        if (!component.data.imageId) {
          return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 text-gray-500 text-sm">
              No Logo Selected
            </div>
          );
        }
        return (
          <ImageComponent
            imageId={component.data.imageId}
            alt="Logo Image"
            scaleMode={component.data.scaleMode || 'contain'}
          />
        );
      case ComponentType.TEXT:
        const textAlign = component.style.textAlign || 'center';
        const getJustifyClass = () => {
          switch (textAlign) {
            case 'left': return 'justify-start';
            case 'right': return 'justify-end';
            case 'center': return 'justify-center';
            default: return 'justify-center';
          }
        };
        const getTextAlignClass = () => {
          switch (textAlign) {
            case 'left': return 'text-left';
            case 'right': return 'text-right';
            case 'center': return 'text-center';
            default: return 'text-center';
          }
        };
        
        return (
          <div 
            className={`w-full h-full flex items-center ${getJustifyClass()} ${getTextAlignClass()} px-2`}
            style={{
              fontSize: `${component.style.fontSize || 16}px`,
              color: component.style.textColor || '#ffffff',
              fontWeight: component.style.fontWeight || 'normal',
              wordWrap: 'break-word',
              overflow: 'hidden',
            }}
          >
            {component.data.text || 'Sample Text'}
          </div>
        );
      case ComponentType.VIDEO:
        if (!component.data.videoId) {
          return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 text-gray-500 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-2">🎥</div>
                <div>No Video Selected</div>
              </div>
            </div>
          );
        }
        return (
          <VideoComponent
            videoId={component.data.videoId}
            scaleMode={component.data.videoData?.scaleMode || 'cover'}
            autoplay={component.data.videoData?.autoplay || false}
            loop={component.data.videoData?.loop || false}
            muted={component.data.videoData?.muted !== false} // default to true
            controls={component.data.videoData?.controls || false}
            volume={component.data.videoData?.volume || 1}
            playbackRate={component.data.videoData?.playbackRate || 1}
          />
        );
      case ComponentType.TENNIS_PLAYER_NAME:
      case ComponentType.TENNIS_DOUBLES_PLAYER_NAME:
      case ComponentType.TENNIS_TEAM_NAMES:
      case ComponentType.TENNIS_ADAPTIVE_TEAM_DISPLAY:
      case ComponentType.TENNIS_GAME_SCORE:
      case ComponentType.TENNIS_SET_SCORE:
      case ComponentType.TENNIS_MATCH_SCORE:
      case ComponentType.TENNIS_DETAILED_SET_SCORE:
      case ComponentType.TENNIS_SERVING_INDICATOR:
      // Player-specific set score components
      case ComponentType.PLAYER1_SET1:
      case ComponentType.PLAYER2_SET1:
      case ComponentType.PLAYER1_SET2:
      case ComponentType.PLAYER2_SET2:
      case ComponentType.PLAYER1_SET3:
      case ComponentType.PLAYER2_SET3:
      case ComponentType.PLAYER1_SET4:
      case ComponentType.PLAYER2_SET4:
      case ComponentType.PLAYER1_SET5:
      case ComponentType.PLAYER2_SET5:
      // Individual set components
      case ComponentType.TENNIS_SET_1:
      case ComponentType.TENNIS_SET_2:
      case ComponentType.TENNIS_SET_3:
      case ComponentType.TENNIS_SET_4:
      case ComponentType.TENNIS_SET_5:
        return renderTennisComponent();
      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-red-200 text-red-700 text-sm">
            Unknown Component
          </div>
        );
    }
  };

  /**
   * Renders tennis-specific components with live data integration.
   * 
   * Maps component types to tennis match data fields:
   * - Player names from player1/player2
   * - Scores from score object
   * - Set scores from sets object
   * - Serving indicator based on serving_player
   * 
   * Falls back to component.data.text or default text if no live data available.
   * 
   * @returns JSX element for tennis component display
   */
  const renderTennisComponent = () => {
    // Get live data value for this component from tennis-api
    // First check for custom fallback text, then use default
    let displayValue = component.data.text || getDefaultTennisText();

    const textAlign = component.style.textAlign || 'center';
    const getJustifyClass = () => {
      switch (textAlign) {
        case 'left': return 'justify-start';
        case 'right': return 'justify-end';
        case 'center': return 'justify-center';
        default: return 'justify-center';
      }
    };
    const getTextAlignClass = () => {
      switch (textAlign) {
        case 'left': return 'text-left';
        case 'right': return 'text-right';
        case 'center': return 'text-center';
        default: return 'text-center';
      }
    };

    if (tennisMatch) {
      // Map component types to tennis match data
      switch (component.type) {
        case ComponentType.TENNIS_PLAYER_NAME:
          displayValue = component.data.playerNumber === 2 ? tennisMatch.player2?.name || 'Player 2' : tennisMatch.player1?.name || 'Player 1';
          break;
        case ComponentType.TENNIS_DOUBLES_PLAYER_NAME:
        case ComponentType.TENNIS_TEAM_NAMES:
        case ComponentType.TENNIS_ADAPTIVE_TEAM_DISPLAY:
          // Use TennisPlayerNameDisplay for these component types
          return (
            <div
              className={`w-full h-full flex items-center ${getJustifyClass()} ${getTextAlignClass()} px-2 relative score-change-base tennis-component`}
              style={{
                fontSize: `${component.style.fontSize || 16}px`,
                color: component.style.textColor || '#ffffff',
                fontWeight: component.style.fontWeight || 'bold',
                wordWrap: 'break-word',
                overflow: 'hidden',
                transition: 'transform 0.2s ease',
              }}
              data-component-id={component.id}
              data-component-type={component.type}
              data-player-number={component.data.playerNumber || 1}
            >
              <TennisPlayerNameDisplay
                tennisMatch={tennisMatch}
                componentType={component.type}
                componentData={component.data}
                fallbackText={component.data.text || getDefaultTennisText()}
              />
            </div>
          );
        case ComponentType.TENNIS_GAME_SCORE:
          if (tennisMatch) {
            displayValue = component.data.playerNumber === 2 ? tennisMatch.score.player2_points : tennisMatch.score.player1_points;
          }
          // Keep custom fallback text for game score
          break;
        case ComponentType.TENNIS_SET_SCORE:
          if (tennisMatch) {
            displayValue = component.data.playerNumber === 2 ? tennisMatch.score.player2_sets.toString() : tennisMatch.score.player1_sets.toString();
          }
          // Keep custom fallback text for set score
          break;
        case ComponentType.TENNIS_MATCH_SCORE:
          if (tennisMatch) {
            // Display overall match score as sets
            displayValue = `${tennisMatch.score.player1_sets}-${tennisMatch.score.player2_sets}`;
          }
          // Keep custom fallback text for match score
          break;
        case ComponentType.TENNIS_DETAILED_SET_SCORE:
          if (tennisMatch && tennisMatch.sets) {
            const playerNumber = component.data.playerNumber || 1;
            const setNumber = component.data.setNumber || 1;
            const setKey = setNumber.toString();

            if (tennisMatch.sets[setKey]) {
              // Get the score for the specified player in the specified set
              const playerScore = playerNumber === 1
                ? (tennisMatch.sets[setKey].player1 || 0)
                : (tennisMatch.sets[setKey].player2 || 0);

              displayValue = playerScore.toString();
            } else {
              // Set doesn't exist yet
              displayValue = '0';
            }
          } else {
            // Fallback to component text or default
            displayValue = component.data.text || '0';
          }
          break;
        case ComponentType.TENNIS_SERVING_INDICATOR:
          // Show serving indicator only for the selected player
          if (tennisMatch) {
            const servingPlayer = tennisMatch.serving_player;
            const selectedPlayer = component.data.playerNumber || 1; // Default to player 1
            if (servingPlayer === selectedPlayer) {
              displayValue = '●'; // Dot when selected player is serving
            } else {
              displayValue = ''; // Empty when selected player is not serving
            }
          }
          // Keep custom fallback text for serving indicator
          break;

        // Player-specific set score components
        case ComponentType.PLAYER1_SET1:
          if (tennisMatch && tennisMatch.sets && tennisMatch.sets['1']) {
            displayValue = tennisMatch.sets['1'].player1?.toString() || '0';
          } else {
            displayValue = component.data.text || '0';
          }
          break;
        case ComponentType.PLAYER2_SET1:
          if (tennisMatch && tennisMatch.sets && tennisMatch.sets['1']) {
            displayValue = tennisMatch.sets['1'].player2?.toString() || '0';
          } else {
            displayValue = component.data.text || '0';
          }
          break;
        case ComponentType.PLAYER1_SET2:
          if (tennisMatch && tennisMatch.sets && tennisMatch.sets['2']) {
            displayValue = tennisMatch.sets['2'].player1?.toString() || '0';
          } else {
            displayValue = component.data.text || '';
          }
          break;
        case ComponentType.PLAYER2_SET2:
          if (tennisMatch && tennisMatch.sets && tennisMatch.sets['2']) {
            displayValue = tennisMatch.sets['2'].player2?.toString() || '0';
          } else {
            displayValue = component.data.text || '';
          }
          break;
        case ComponentType.PLAYER1_SET3:
          if (tennisMatch && tennisMatch.sets && tennisMatch.sets['3']) {
            displayValue = tennisMatch.sets['3'].player1?.toString() || '0';
          } else {
            displayValue = component.data.text || '';
          }
          break;
        case ComponentType.PLAYER2_SET3:
          if (tennisMatch && tennisMatch.sets && tennisMatch.sets['3']) {
            displayValue = tennisMatch.sets['3'].player2?.toString() || '0';
          } else {
            displayValue = component.data.text || '';
          }
          break;
        case ComponentType.PLAYER1_SET4:
          if (tennisMatch && tennisMatch.sets && tennisMatch.sets['4']) {
            displayValue = tennisMatch.sets['4'].player1?.toString() || '0';
          } else {
            displayValue = component.data.text || '';
          }
          break;
        case ComponentType.PLAYER2_SET4:
          if (tennisMatch && tennisMatch.sets && tennisMatch.sets['4']) {
            displayValue = tennisMatch.sets['4'].player2?.toString() || '0';
          } else {
            displayValue = component.data.text || '';
          }
          break;
        case ComponentType.PLAYER1_SET5:
          if (tennisMatch && tennisMatch.sets && tennisMatch.sets['5']) {
            displayValue = tennisMatch.sets['5'].player1?.toString() || '0';
          } else {
            displayValue = component.data.text || '';
          }
          break;
        case ComponentType.PLAYER2_SET5:
          if (tennisMatch && tennisMatch.sets && tennisMatch.sets['5']) {
            displayValue = tennisMatch.sets['5'].player2?.toString() || '0';
          } else {
            displayValue = component.data.text || '';
          }
          break;

        // Individual set components
        case ComponentType.TENNIS_SET_1:
          if (tennisMatch && tennisMatch.sets && tennisMatch.sets['1']) {
            const set = tennisMatch.sets['1'];
            displayValue = `${set.player1 || 0}-${set.player2 || 0}`;
          } else {
            displayValue = component.data.text || '0-0';
          }
          break;
        case ComponentType.TENNIS_SET_2:
          if (tennisMatch && tennisMatch.sets && tennisMatch.sets['2']) {
            const set = tennisMatch.sets['2'];
            displayValue = `${set.player1 || 0}-${set.player2 || 0}`;
          } else {
            displayValue = component.data.text || '';
          }
          break;
        case ComponentType.TENNIS_SET_3:
          if (tennisMatch && tennisMatch.sets && tennisMatch.sets['3']) {
            const set = tennisMatch.sets['3'];
            displayValue = `${set.player1 || 0}-${set.player2 || 0}`;
          } else {
            displayValue = component.data.text || '';
          }
          break;
        case ComponentType.TENNIS_SET_4:
          if (tennisMatch && tennisMatch.sets && tennisMatch.sets['4']) {
            const set = tennisMatch.sets['4'];
            displayValue = `${set.player1 || 0}-${set.player2 || 0}`;
          } else {
            displayValue = component.data.text || '';
          }
          break;
        case ComponentType.TENNIS_SET_5:
          if (tennisMatch && tennisMatch.sets && tennisMatch.sets['5']) {
            const set = tennisMatch.sets['5'];
            displayValue = `${set.player1 || 0}-${set.player2 || 0}`;
          } else {
            displayValue = component.data.text || '';
          }
          break;
      }
    }

    return (
      <div
        className={`w-full h-full flex items-center ${getJustifyClass()} ${getTextAlignClass()} px-2 relative score-change-base tennis-component`}
        style={{
          fontSize: `${component.style.fontSize || 16}px`,
          color: component.style.textColor || '#ffffff',
          fontWeight: component.style.fontWeight || 'bold',
          wordWrap: 'break-word',
          overflow: 'hidden',
          transition: 'transform 0.2s ease',
        }}
        data-component-id={component.id}
        data-component-type={component.type}
        data-player-number={component.data.playerNumber || 1}
      >
        {displayValue}
        {/* Tennis API indicator */}
      </div>
    );
  };

  /**
   * Gets default display text for tennis components when no live data is available.
   * 
   * Provides sensible defaults for each component type:
   * - Player names: "Player 1", "Player 2"
   * - Doubles names: "Smith / Johnson"
   * - Scores: "0"
   * - Serving indicator: "●"
   * 
   * @returns Default text string for the component type
   */
  const getDefaultTennisText = () => {
    switch (component.type) {
      case ComponentType.TENNIS_PLAYER_NAME:
        return `Player ${component.data.playerNumber || 1}`;
      case ComponentType.TENNIS_DOUBLES_PLAYER_NAME:
        const playerNum = component.data.playerNumber || 1;
        if (playerNum === 1 || playerNum === 2) return 'Smith / Johnson';
        if (playerNum === 3 || playerNum === 4) return 'Williams / Brown';
        return 'Smith / Johnson';
      case ComponentType.TENNIS_TEAM_NAMES:
        const teamSelection = component.data.teamSelection || 0;
        if (teamSelection === 1) return 'Team 1';
        if (teamSelection === 2) return 'Team 2';
        return 'Team 1 vs Team 2';
      case ComponentType.TENNIS_ADAPTIVE_TEAM_DISPLAY:
        const adaptiveTeamSelection = component.data.teamSelection || 0;
        if (adaptiveTeamSelection === 1) return 'School A';
        if (adaptiveTeamSelection === 2) return 'School B';
        return 'School A - Smith vs School B - Johnson';
      case ComponentType.TENNIS_GAME_SCORE:
        return '0';
      case ComponentType.TENNIS_SET_SCORE:
        return '0';
      case ComponentType.TENNIS_MATCH_SCORE:
        return '0';
      case ComponentType.TENNIS_DETAILED_SET_SCORE:
        return '0'; // Shows single set score for specific player and set
      case ComponentType.TENNIS_SERVING_INDICATOR:
        return '●';
      // Player-specific set score components
      case ComponentType.PLAYER1_SET1:
      case ComponentType.PLAYER2_SET1:
        return '0';
      case ComponentType.PLAYER1_SET2:
      case ComponentType.PLAYER2_SET2:
      case ComponentType.PLAYER1_SET3:
      case ComponentType.PLAYER2_SET3:
      case ComponentType.PLAYER1_SET4:
      case ComponentType.PLAYER2_SET4:
      case ComponentType.PLAYER1_SET5:
      case ComponentType.PLAYER2_SET5:
        return '';
      // Individual set components
      case ComponentType.TENNIS_SET_1:
        return '0-0';
      case ComponentType.TENNIS_SET_2:
      case ComponentType.TENNIS_SET_3:
      case ComponentType.TENNIS_SET_4:
      case ComponentType.TENNIS_SET_5:
        return '';
      default:
        return 'Tennis Data';
    }
  };

  /**
   * Handles component click to select it.
   * 
   * @param e - Mouse event
   */
  const handleComponentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(component.id);
    }
  };

  /**
   * Applies drag transform style from @dnd-kit during drag operation.
   */
  const transformStyle = transform ? {
    transform: CSS.Translate.toString(transform),
  } : {};

  /**
   * Gets the background color for the component.
   * Supports both hex colors and RGB color objects.
   * 
   * @returns CSS color string
   */
  const getBackgroundColor = () => {
    if (component.style.rgbColor) {
      const { r, g, b, a = 1 } = component.style.rgbColor;
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return component.style.backgroundColor || '#ffffff';
  };

  return (
    <div
      ref={setNodeRef}
      className={`component-item ${isSelected ? 'component-selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'absolute',
        left: component.position.x,
        top: component.position.y,
        width: component.size.width,
        height: component.size.height,
        backgroundColor: getBackgroundColor(),
        border: `${component.style.borderWidth || 0}px solid ${component.style.borderColor === 'transparent' ? 'transparent' : (component.style.borderColor || '#000000')}`,
        borderRadius: `${component.style.borderRadius || 0}px`,
        display: 'flex',
        alignItems: (component.type === ComponentType.BACKGROUND || component.type === ComponentType.LOGO) && component.data.imageId ? 'stretch' : 'center',
        justifyContent: (component.type === ComponentType.BACKGROUND || component.type === ComponentType.LOGO) && component.data.imageId ? 'stretch' : 'center',
        textAlign: 'center',
        padding: (component.type === ComponentType.BACKGROUND || component.type === ComponentType.LOGO) && component.data.imageId ? 0 : 8,
        overflow: (component.type === ComponentType.BACKGROUND || component.type === ComponentType.LOGO) && component.data.imageId ? 'hidden' : 'visible',
        opacity: isDragging ? 0.5 : (component.style.opacity || 1),
        zIndex: component.zIndex || 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        ...transformStyle,
      }}
      onClick={handleComponentClick}
      {...listeners}
      {...(!isResizing ? attributes : {})}
    >
      {renderComponentContent()}
      <ResizeHandles
        component={component}
        isSelected={isSelected}
        onResizeStart={handleResizeStart}
      />
    </div>
  );
}; 