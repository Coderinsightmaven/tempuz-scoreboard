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
      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-red-200 text-red-700 text-sm">
            Unknown Component
          </div>
        );
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
        border: `${component.style.borderWidth || 1}px solid ${component.style.borderColor || '#000000'}`,
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