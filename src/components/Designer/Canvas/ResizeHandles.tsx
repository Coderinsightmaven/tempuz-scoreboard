// src/components/Designer/Canvas/ResizeHandles.tsx
import React from 'react';
import { ResizeHandle } from '../../../types/canvas';
import { ScoreboardComponent } from '../../../types/scoreboard';

interface ResizeHandlesProps {
  component: ScoreboardComponent;
  isSelected: boolean;
  onResizeStart: (handle: ResizeHandle, event: React.MouseEvent) => void;
}

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({
  component,
  isSelected,
  onResizeStart,
}) => {
  if (!isSelected) return null;

  const handleSize = 8;
  const handles = [
    { handle: ResizeHandle.TOP_LEFT, cursor: 'nw-resize', x: -handleSize/2, y: -handleSize/2 },
    { handle: ResizeHandle.TOP_CENTER, cursor: 'n-resize', x: component.size.width/2 - handleSize/2, y: -handleSize/2 },
    { handle: ResizeHandle.TOP_RIGHT, cursor: 'ne-resize', x: component.size.width - handleSize/2, y: -handleSize/2 },
    { handle: ResizeHandle.MIDDLE_LEFT, cursor: 'w-resize', x: -handleSize/2, y: component.size.height/2 - handleSize/2 },
    { handle: ResizeHandle.MIDDLE_RIGHT, cursor: 'e-resize', x: component.size.width - handleSize/2, y: component.size.height/2 - handleSize/2 },
    { handle: ResizeHandle.BOTTOM_LEFT, cursor: 'sw-resize', x: -handleSize/2, y: component.size.height - handleSize/2 },
    { handle: ResizeHandle.BOTTOM_CENTER, cursor: 's-resize', x: component.size.width/2 - handleSize/2, y: component.size.height - handleSize/2 },
    { handle: ResizeHandle.BOTTOM_RIGHT, cursor: 'se-resize', x: component.size.width - handleSize/2, y: component.size.height - handleSize/2 },
  ];

  const handleMouseDown = (handle: ResizeHandle, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    onResizeStart(handle, event);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: component.size.width,
        height: component.size.height,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {handles.map(({ handle, cursor, x, y }) => (
        <div
          key={handle}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: handleSize,
            height: handleSize,
            backgroundColor: '#3b82f6',
            border: '1px solid #ffffff',
            borderRadius: '2px',
            cursor,
            pointerEvents: 'auto',
            zIndex: 1001,
          }}
          onMouseDown={(e) => handleMouseDown(handle, e)}
        />
      ))}
      
      {/* Selection border */}
      <div
        style={{
          position: 'absolute',
          left: -1,
          top: -1,
          width: component.size.width + 2,
          height: component.size.height + 2,
          border: '2px solid #3b82f6',
          borderRadius: '2px',
          pointerEvents: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}; 