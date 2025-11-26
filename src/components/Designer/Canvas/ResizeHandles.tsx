/**
 * ResizeHandles - Renders resize handles for selected components.
 * 
 * Features:
 * - 8 resize handles (4 corners, 4 edges)
 * - Appropriate cursor styles for each handle
 * - Selection border around component
 * - Only visible when component is selected
 * 
 * Handle positions:
 * - Corners: TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT
 * - Edges: TOP_CENTER, BOTTOM_CENTER, MIDDLE_LEFT, MIDDLE_RIGHT
 */
// src/components/Designer/Canvas/ResizeHandles.tsx
import React from 'react';
import { ResizeHandle } from '../../../types/canvas';
import { ScoreboardComponent } from '../../../types/scoreboard';

interface ResizeHandlesProps {
  /** The component to show handles for */
  component: ScoreboardComponent;
  /** Whether the component is currently selected */
  isSelected: boolean;
  /** Callback when a resize handle is grabbed */
  onResizeStart: (handle: ResizeHandle, event: React.MouseEvent) => void;
}

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({
  component,
  isSelected,
  onResizeStart,
}) => {
  // Only show handles when component is selected
  if (!isSelected) return null;

  /** Size of each resize handle in pixels */
  const handleSize = 8;
  
  /**
   * Array of resize handle configurations.
   * Each handle has:
   * - handle: ResizeHandle enum value
   * - cursor: CSS cursor style
   * - x, y: Position relative to component top-left
   */
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

  /**
   * Handles mouse down on a resize handle.
   * Prevents event propagation and starts resize operation.
   * 
   * @param handle - Which handle was clicked
   * @param event - Mouse event
   */
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