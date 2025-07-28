import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ScoreboardComponent, ComponentType } from '../../../types/scoreboard';
import { ResizeHandle } from '../../../types/canvas';
import { ResizeHandles } from './ResizeHandles';
import { ImageComponent } from './ImageComponent';
import { useCanvasStore } from '../../../stores/useCanvasStore';

interface DraggableComponentProps {
  component: ScoreboardComponent;
  onSelect?: (id: string) => void;
  onResizeStart?: (componentId: string, handle: ResizeHandle, event: React.MouseEvent) => void;
}

export const DraggableComponent: React.FC<DraggableComponentProps> = ({
  component,
  onSelect,
  onResizeStart,
}) => {
  const { selectedComponents, isResizing } = useCanvasStore();
  const isSelected = selectedComponents.has(component.id);

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
      case ComponentType.SCORE:
        return component.data.value?.toString() || '0';
      case ComponentType.TIMER:
        return component.data.value || '00:00';
      case ComponentType.TEAM_NAME:
        return component.data.text || 'Team Name';
      case ComponentType.TEXT:
        return component.data.text || 'Text';
      case ComponentType.PERIOD:
        return `Period ${component.data.value || 1}`;
      case ComponentType.LOGO:
        return '🏀';
      case ComponentType.IMAGE:
        return component.data.imageId ? (
          <ImageComponent
            imageId={component.data.imageId}
            alt={component.data.text || 'Image'}
          />
        ) : 'No Image';
      case ComponentType.RECTANGLE:
        return '';
      case ComponentType.CIRCLE:
        return '';
      
      // Tennis components
      case ComponentType.TENNIS_SET_SCORE:
        const setData = component.data.tennisData;
        return `${setData?.player1SetScore || 0} - ${setData?.player2SetScore || 0}`;
      case ComponentType.TENNIS_GAME_SCORE:
        const gameData = component.data.tennisData;
        return `${gameData?.player1GameScore || '0'} - ${gameData?.player2GameScore || '0'}`;
      case ComponentType.TENNIS_CURRENT_GAME:
        const currentData = component.data.tennisData;
        return `${currentData?.player1CurrentGame || 0} - ${currentData?.player2CurrentGame || 0}`;
      case ComponentType.TENNIS_SERVER_INDICATOR:
        return '●';
      case ComponentType.TENNIS_PLAYER_NAME:
        return component.data.text || 'Player Name';
      case ComponentType.TENNIS_MATCH_STATUS:
        return component.data.text || 'In Progress';
      case ComponentType.TENNIS_TIEBREAK_SCORE:
        const tieData = component.data.tennisData?.tiebreakScore;
        return `${tieData?.player1 || 0} - ${tieData?.player2 || 0}`;
      case ComponentType.BACKGROUND_COLOR:
        return '';
      
      default:
        return 'Component';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
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

  // Special styling for tennis components
  const getComponentSpecificStyles = () => {
    const baseStyles = {
      fontSize: component.style.fontSize || 16,
      fontFamily: component.style.fontFamily || 'Arial, sans-serif',
      fontWeight: component.style.fontWeight || 'normal',
      color: component.style.textColor || '#000000',
    };

    switch (component.type) {
      case ComponentType.TENNIS_SERVER_INDICATOR:
        return {
          ...baseStyles,
          borderRadius: '50%',
          fontSize: 12,
          backgroundColor: component.data.tennisData?.servingPlayer === 1 ? '#fbbf24' : '#6b7280',
        };
      case ComponentType.TENNIS_TIEBREAK_SCORE:
        return {
          ...baseStyles,
          backgroundColor: '#ef4444',
          color: '#ffffff',
          fontWeight: 'bold',
        };
      case ComponentType.BACKGROUND_COLOR:
        return {
          ...baseStyles,
          backgroundColor: getBackgroundColor(),
          border: 'none',
        };
      default:
        return baseStyles;
    }
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
        border: 'none',
        borderRadius: component.type === ComponentType.CIRCLE || component.type === ComponentType.TENNIS_SERVER_INDICATOR ? '50%' : `${component.style.borderRadius || 0}px`,
        display: 'flex',
        alignItems: component.type === ComponentType.IMAGE && component.data.imageId ? 'stretch' : 'center',
        justifyContent: component.type === ComponentType.IMAGE && component.data.imageId ? 'stretch' : 'center',
        textAlign: 'center',
        padding: component.type === ComponentType.IMAGE && component.data.imageId ? 0 : undefined,
        overflow: component.type === ComponentType.IMAGE && component.data.imageId ? 'hidden' : undefined,
        opacity: isDragging ? 0.5 : 1, // Only reduce opacity when dragging, background transparency is handled via RGBA
        zIndex: component.type === ComponentType.BACKGROUND_COLOR 
          ? Math.min(component.zIndex || -1, -1) // Always behind other components
          : component.zIndex || 1,
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : (isResizing ? 'default' : 'grab'),
        ...getComponentSpecificStyles(),
        ...transformStyle,
      }}
      onClick={handleClick}
      {...(!isResizing ? listeners : {})}
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