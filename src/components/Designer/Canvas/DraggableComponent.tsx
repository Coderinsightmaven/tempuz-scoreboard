import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ScoreboardComponent, ComponentType } from '../../../types/scoreboard';
import { useCanvasStore } from '../../../stores/useCanvasStore';

interface DraggableComponentProps {
  component: ScoreboardComponent;
  onSelect?: (id: string) => void;
}

export const DraggableComponent: React.FC<DraggableComponentProps> = ({
  component,
  onSelect,
}) => {
  const { selectedComponents } = useCanvasStore();
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
      case ComponentType.RECTANGLE:
        return '';
      case ComponentType.CIRCLE:
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
        backgroundColor: component.style.backgroundColor || '#ffffff',
        border: '1px solid #000000',
        borderRadius: component.type === ComponentType.CIRCLE ? '50%' : '0px',
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'normal',
        color: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        opacity: isDragging ? 0.5 : 1,
        zIndex: component.zIndex || 1,
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        ...transformStyle,
      }}
      onClick={handleClick}
      {...listeners}
      {...attributes}
    >
      {renderComponentContent()}
      {isSelected && (
        <div 
          className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </div>
  );
}; 