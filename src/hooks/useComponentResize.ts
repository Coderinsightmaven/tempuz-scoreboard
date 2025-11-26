import { useState, useCallback, useEffect } from 'react';
import { useScoreboardStore } from '../stores/useScoreboardStore';
import { useCanvasStore } from '../stores/useCanvasStore';
import { ResizeHandle } from '../types/canvas';

/**
 * Hook that handles component resize operations on the canvas.
 * 
 * Features:
 * - Resize start/end handling
 * - Mouse move tracking during resize
 * - Handle-specific resize logic (corners and edges)
 * - Minimum size enforcement (20px)
 * - Canvas bounds constraint
 * - Real-time position and size updates
 * 
 * Resize handles:
 * - Corners: TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT
 * - Edges: TOP_CENTER, BOTTOM_CENTER, MIDDLE_LEFT, MIDDLE_RIGHT
 * 
 * @returns Object with resize handlers and state
 */
export const useComponentResize = () => {
  const {
    components,
    updateComponentPosition,
    updateComponentSize,
  } = useScoreboardStore();

  const {
    canvasSize,
    startResize,
    endResize,
  } = useCanvasStore();

  const [resizeState, setResizeState] = useState<{
    componentId: string;
    handle: ResizeHandle;
    startMousePos: { x: number; y: number };
    startSize: { width: number; height: number };
    startPosition: { x: number; y: number };
  } | null>(null);

  /**
   * Starts a resize operation on a component.
   * 
   * Process:
   * 1. Captures initial mouse position
   * 2. Stores component's current size and position
   * 3. Updates canvas store resize state
   * 
   * @param componentId - ID of component being resized
   * @param handle - Which resize handle is being used
   * @param event - Mouse event that triggered the resize
   */
  const handleResizeStart = useCallback((componentId: string, handle: ResizeHandle, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    setResizeState({
      componentId,
      handle,
      startMousePos: { x: event.clientX, y: event.clientY },
      startSize: { ...component.size },
      startPosition: { ...component.position },
    });
    
    // Update canvas store resize state
    startResize(componentId, handle);
  }, [components, startResize]);

  /**
   * Handles mouse movement during resize operation.
   * 
   * Algorithm:
   * 1. Calculates mouse delta from start position
   * 2. Determines which edges/corners to move based on handle
   * 3. Keeps opposite edge/corner fixed (anchor point)
   * 4. Calculates new dimensions from edge positions
   * 5. Enforces minimum size (20px)
   * 6. Constrains to canvas bounds
   * 7. Updates component position and size
   * 
   * @param event - Mouse move event
   */
  const handleResizeMove = useCallback((event: MouseEvent) => {
    if (!resizeState) return;

    const deltaX = event.clientX - resizeState.startMousePos.x;
    const deltaY = event.clientY - resizeState.startMousePos.y;

    // Calculate the fixed anchor points (opposite corners/edges)
    const startLeft = resizeState.startPosition.x;
    const startTop = resizeState.startPosition.y;
    const startRight = startLeft + resizeState.startSize.width;
    const startBottom = startTop + resizeState.startSize.height;

    let newLeft = startLeft;
    let newTop = startTop;
    let newRight = startRight;
    let newBottom = startBottom;

    // Move only the specific edge/corner being dragged
    // The opposite edge/corner remains fixed as the anchor point
    switch (resizeState.handle) {
      case ResizeHandle.TOP_LEFT:
        // Move top-left corner, keep bottom-right fixed
        newLeft = startLeft + deltaX;
        newTop = startTop + deltaY;
        break;
      case ResizeHandle.TOP_CENTER:
        // Move top edge, keep bottom edge fixed
        newTop = startTop + deltaY;
        break;
      case ResizeHandle.TOP_RIGHT:
        // Move top-right corner, keep bottom-left fixed
        newRight = startRight + deltaX;
        newTop = startTop + deltaY;
        break;
      case ResizeHandle.MIDDLE_LEFT:
        // Move left edge, keep right edge fixed
        newLeft = startLeft + deltaX;
        break;
      case ResizeHandle.MIDDLE_RIGHT:
        // Move right edge, keep left edge fixed
        newRight = startRight + deltaX;
        break;
      case ResizeHandle.BOTTOM_LEFT:
        // Move bottom-left corner, keep top-right fixed
        newLeft = startLeft + deltaX;
        newBottom = startBottom + deltaY;
        break;
      case ResizeHandle.BOTTOM_CENTER:
        // Move bottom edge, keep top edge fixed
        newBottom = startBottom + deltaY;
        break;
      case ResizeHandle.BOTTOM_RIGHT:
        // Move bottom-right corner, keep top-left fixed
        newRight = startRight + deltaX;
        newBottom = startBottom + deltaY;
        break;
    }

    // Calculate new dimensions from the edge positions
    let newWidth = newRight - newLeft;
    let newHeight = newBottom - newTop;

    // Enforce minimum size (20px)
    // Adjust anchor point if minimum size would be violated
    const minSize = 20;
    if (newWidth < minSize) {
      // Adjust left or right edge to maintain minimum width
      if (resizeState.handle === ResizeHandle.TOP_LEFT || 
          resizeState.handle === ResizeHandle.MIDDLE_LEFT || 
          resizeState.handle === ResizeHandle.BOTTOM_LEFT) {
        newLeft = newRight - minSize;
      } else if (resizeState.handle === ResizeHandle.TOP_RIGHT || 
                 resizeState.handle === ResizeHandle.MIDDLE_RIGHT || 
                 resizeState.handle === ResizeHandle.BOTTOM_RIGHT) {
        newRight = newLeft + minSize;
      }
      newWidth = minSize;
    }
    
    if (newHeight < minSize) {
      // Adjust top or bottom edge to maintain minimum height
      if (resizeState.handle === ResizeHandle.TOP_LEFT || 
          resizeState.handle === ResizeHandle.TOP_CENTER || 
          resizeState.handle === ResizeHandle.TOP_RIGHT) {
        newTop = newBottom - minSize;
      } else if (resizeState.handle === ResizeHandle.BOTTOM_LEFT || 
                 resizeState.handle === ResizeHandle.BOTTOM_CENTER || 
                 resizeState.handle === ResizeHandle.BOTTOM_RIGHT) {
        newBottom = newTop + minSize;
      }
      newHeight = minSize;
    }

    // Constrain to canvas bounds
    // Prevent component from going outside canvas boundaries
    if (newLeft < 0) {
      newLeft = 0;
      newWidth = newRight - newLeft;
    }
    if (newTop < 0) {
      newTop = 0;
      newHeight = newBottom - newTop;
    }
    if (newRight > canvasSize.width) {
      newRight = canvasSize.width;
      newWidth = newRight - newLeft;
    }
    if (newBottom > canvasSize.height) {
      newBottom = canvasSize.height;
      newHeight = newBottom - newTop;
    }

    // Update component with new position and size
    updateComponentSize(resizeState.componentId, { width: newWidth, height: newHeight });
    updateComponentPosition(resizeState.componentId, { x: newLeft, y: newTop });
  }, [resizeState, canvasSize, updateComponentSize, updateComponentPosition]);

  /**
   * Ends the resize operation and cleans up.
   */
  const handleResizeEnd = useCallback(() => {
    setResizeState(null);
    endResize();
  }, [endResize]);

  // Set up mouse event listeners for resize
  // Listens to document-level events to handle mouse movement outside component bounds
  useEffect(() => {
    if (resizeState) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      // Add CSS class to body to prevent text selection during resize
      document.body.classList.add('resizing');
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.classList.remove('resizing');
      };
    }
  }, [resizeState, handleResizeMove, handleResizeEnd]);

  return {
    handleResizeStart,
    resizeState,
  };
};
