import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ScoreboardComponent, ComponentType } from '../../../types/scoreboard';
import { ResizeHandle } from '../../../types/canvas';
import { ResizeHandles } from './ResizeHandles';
import { ImageComponent } from './ImageComponent';
import { VideoComponent } from './VideoComponent';
import { useCanvasStore } from '../../../stores/useCanvasStore';
import { useLiveDataStore } from '../../../stores/useLiveDataStore';

interface DraggableComponentProps {
  component: ScoreboardComponent;
  onSelect?: (id: string) => void;
  onResizeStart?: (componentId: string, handle: ResizeHandle, event: React.MouseEvent) => void;
  tennisApiScoreboardId?: string; // For filtering tennis data in scoreboard windows
}

export const DraggableComponent: React.FC<DraggableComponentProps> = ({
  component,
  onSelect,
  onResizeStart,
  tennisApiScoreboardId,
}) => {
  const { selectedComponents, isResizing } = useCanvasStore();
  const isSelected = selectedComponents.has(component.id);

  // For tennis components, get the live data from tennis-api store
  const tennisMatch = component.type.startsWith('tennis_') ?
    (() => {
      const state = useLiveDataStore.getState();

      // If a specific tennis API scoreboard ID is provided (for scoreboard windows),
      // only get data from that scoreboard
      if (tennisApiScoreboardId) {
        return state.getTennisApiMatch(tennisApiScoreboardId);
      }

      // For design canvas (no specific scoreboard ID), get match by component ID
      return state.getTennisApiMatch(component.id);
    })() : null;
  
  // Tennis data change animation disabled to prevent visual clutter

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

  const handleResizeStart = (handle: ResizeHandle, event: React.MouseEvent) => {
    if (onResizeStart) {
      onResizeStart(component.id, handle, event);
    }
  };

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
      case ComponentType.TENNIS_GAME_SCORE:
      case ComponentType.TENNIS_SET_SCORE:
      case ComponentType.TENNIS_MATCH_SCORE:
      case ComponentType.TENNIS_DETAILED_SET_SCORE:
      case ComponentType.TENNIS_SERVING_INDICATOR:
        return renderTennisComponent();
      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-red-200 text-red-700 text-sm">
            Unknown Component
          </div>
        );
    }
  };

  const renderTennisComponent = () => {
    // Get live data value for this component from tennis-api
    let displayValue = getDefaultTennisText();

    if (tennisMatch) {
      // Map component types to tennis match data
      switch (component.type) {
        case ComponentType.TENNIS_PLAYER_NAME:
          displayValue = component.data.playerNumber === 2 ? tennisMatch.player2Name || 'Player 2' : tennisMatch.player1Name || 'Player 1';
          break;
        case ComponentType.TENNIS_DOUBLES_PLAYER_NAME:
          // Handle doubles player names - display as "Lastname / Lastname"
          const extractLastName = (fullName: string) => {
            if (!fullName) return '';
            const parts = fullName.trim().split(' ');
            return parts[parts.length - 1]; // Get the last part (lastname)
          };

          if (tennisMatch.doublesPlayers) {
            // Show team format: "Player1Last / Player2Last"
            if (component.data.playerNumber === 1 || component.data.playerNumber === 2) {
              // Team 1
              const player1Name = tennisMatch.doublesPlayers.team1.player1.name || 'Player1';
              const player2Name = tennisMatch.doublesPlayers.team1.player2.name || 'Player2';
              const player1Last = extractLastName(player1Name);
              const player2Last = extractLastName(player2Name);
              displayValue = `${player1Last} / ${player2Last}`;
            } else {
              // Team 2
              const player1Name = tennisMatch.doublesPlayers.team2.player1.name || 'Player1';
              const player2Name = tennisMatch.doublesPlayers.team2.player2.name || 'Player2';
              const player1Last = extractLastName(player1Name);
              const player2Last = extractLastName(player2Name);
              displayValue = `${player1Last} / ${player2Last}`;
            }
          } else {
            // Fallback to singles if doubles data not available
            const playerName = component.data.playerNumber === 2 ? tennisMatch.player2Name || 'Player 2' : tennisMatch.player1Name || 'Player 1';
            displayValue = extractLastName(playerName);
          }
          break;
        case ComponentType.TENNIS_GAME_SCORE:
          displayValue = component.data.playerNumber === 2 ? tennisMatch.side2PointScore : tennisMatch.side1PointScore;
          break;
        case ComponentType.TENNIS_SET_SCORE:
          // Count sets won - a set is won when a player reaches 6 games and leads by at least 2
          let setsWon = 0;
          if (tennisMatch.sets) {
            tennisMatch.sets.forEach((set: { setNumber: number; side1Score: number; side2Score: number; winningSide?: number }) => {
              const side1Score = set.side1Score || 0;
              const side2Score = set.side2Score || 0;
              const scoreDiff = Math.abs(side1Score - side2Score);

              // A set is complete if one player has 6+ games and leads by 2+
              if ((side1Score >= 6 || side2Score >= 6) && scoreDiff >= 2) {
                if (component.data.playerNumber === 1 && side1Score > side2Score) {
                  setsWon++;
                } else if (component.data.playerNumber === 2 && side2Score > side1Score) {
                  setsWon++;
                }
              }
            });
          }
          displayValue = setsWon.toString();
          break;
        case ComponentType.TENNIS_MATCH_SCORE:
          displayValue = `${tennisMatch.scoreStringSide1} - ${tennisMatch.scoreStringSide2}`;
          break;
        case ComponentType.TENNIS_DETAILED_SET_SCORE:
          // Show detailed set information
          if (tennisMatch.sets && tennisMatch.sets.length > 0) {
            const setInfo = tennisMatch.sets.map((set: { setNumber: number; side1Score: number; side2Score: number; winningSide?: number }) =>
              `Set ${set.setNumber}: ${set.side1Score}-${set.side2Score}`
            ).join(', ');
            displayValue = setInfo;
          } else {
            displayValue = 'No sets data';
          }
          break;
        case ComponentType.TENNIS_SERVING_INDICATOR:
          // Show serving indicator only for the selected player
          const servingPlayer = tennisMatch.servingPlayer;
          const selectedPlayer = component.data.playerNumber || 1; // Default to player 1
          if (servingPlayer === selectedPlayer) {
            displayValue = '●'; // Dot when selected player is serving
          } else {
            displayValue = ''; // Empty when selected player is not serving
          }
          break;
      }
    }
    
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

  const getDefaultTennisText = () => {
    switch (component.type) {
      case ComponentType.TENNIS_PLAYER_NAME:
        return `Player ${component.data.playerNumber || 1}`;
      case ComponentType.TENNIS_DOUBLES_PLAYER_NAME:
        const playerNum = component.data.playerNumber || 1;
        if (playerNum === 1 || playerNum === 2) return 'Smith / Johnson';
        if (playerNum === 3 || playerNum === 4) return 'Williams / Brown';
        return 'Smith / Johnson';
      case ComponentType.TENNIS_GAME_SCORE:
        return '0';
      case ComponentType.TENNIS_SET_SCORE:
        return '0';
      case ComponentType.TENNIS_MATCH_SCORE:
        return '0';
      case ComponentType.TENNIS_DETAILED_SET_SCORE:
        return '0';
      case ComponentType.TENNIS_SERVING_INDICATOR:
        return '●';
      default:
        return 'Tennis Data';
    }
  };

  const handleComponentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(component.id);
    }
  };

  const transformStyle = transform ? {
    transform: CSS.Translate.toString(transform),
  } : {};

  // Calculate background color from RGB if available
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