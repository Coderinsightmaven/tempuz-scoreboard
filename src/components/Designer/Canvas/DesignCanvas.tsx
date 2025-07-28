import React, { useCallback, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import { useCanvasStore } from '../../../stores/useCanvasStore';
import { useScoreboardStore } from '../../../stores/useScoreboardStore';
import { DraggableComponent } from './DraggableComponent';
import { AlignmentGuides } from './AlignmentGuides';
import { snapToGrid } from '../../../utils/canvas';
import { detectAlignments } from '../../../utils/alignment';
import { ResizeHandle } from '../../../types/canvas';
import { ComponentType } from '../../../types/scoreboard';

export const DesignCanvas: React.FC = () => {
  const {
    canvasSize,
    zoom,
    pan,
    grid,
    selectedComponents,
    alignmentGuides,
    selectComponent,
    clearSelection,
    startDrag,
    endDrag,
    setAlignmentGuides,
    clearAlignmentGuides,
  } = useCanvasStore();

  const {
    components,
    updateComponentPosition,
    updateComponentSize,
  } = useScoreboardStore();

  const [draggedComponentId, setDraggedComponentId] = useState<string | null>(null);
  const [resizeState, setResizeState] = useState<{
    componentId: string;
    handle: ResizeHandle;
    startMousePos: { x: number; y: number };
    startSize: { width: number; height: number };
    startPosition: { x: number; y: number };
  } | null>(null);

  // Modern sensor setup for @dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const componentId = active.id as string;
    
    setDraggedComponentId(componentId);
    startDrag({ x: 0, y: 0 });
    
    // Select the component being dragged if not already selected
    if (!selectedComponents.has(componentId)) {
      selectComponent(componentId);
    }
  }, [selectedComponents, selectComponent, startDrag]);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { delta } = event;
    
    if (!draggedComponentId) return;
    
    const draggedComponent = components.find(c => c.id === draggedComponentId);
    if (!draggedComponent) return;
    
    // Calculate new position based on drag delta
    const newPosition = {
      x: draggedComponent.position.x + delta.x,
      y: draggedComponent.position.y + delta.y
    };
    
    // Detect alignments with other components
    const otherComponents = components.filter(c => c.id !== draggedComponentId);
    const alignmentResult = detectAlignments(draggedComponent, newPosition, otherComponents);
    
    // Update alignment guides
    setAlignmentGuides(alignmentResult.guides);
  }, [draggedComponentId, components, setAlignmentGuides]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event;
    endDrag();
    clearAlignmentGuides();
    setDraggedComponentId(null);

    if (!delta.x && !delta.y) return;

    const component = components.find(c => c.id === active.id);
    if (!component) return;

    let newX = component.position.x + delta.x;
    let newY = component.position.y + delta.y;

    // Check for alignment snapping first
    const newPosition = { x: newX, y: newY };
    const otherComponents = components.filter(c => c.id !== active.id);
    const alignmentResult = detectAlignments(component, newPosition, otherComponents);
    
    if (alignmentResult.snapPosition) {
      if (alignmentResult.snapPosition.x !== undefined) {
        newX = alignmentResult.snapPosition.x;
      }
      if (alignmentResult.snapPosition.y !== undefined) {
        newY = alignmentResult.snapPosition.y;
      }
    } else if (grid.snapToGrid && grid.enabled) {
      // Apply grid snapping only if no alignment snapping occurred
      const gridSettings = { ...grid, color: '#000000', opacity: 0.1 };
      const snapped = snapToGrid({ x: newX, y: newY }, gridSettings);
      newX = snapped.x;
      newY = snapped.y;
    }

    // Constrain to canvas bounds
    newX = Math.max(0, Math.min(canvasSize.width - component.size.width, newX));
    newY = Math.max(0, Math.min(canvasSize.height - component.size.height, newY));

    // Update component position
    updateComponentPosition(active.id as string, { x: newX, y: newY });
  }, [components, grid, canvasSize, updateComponentPosition, endDrag, clearAlignmentGuides, detectAlignments]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Clear selection when clicking on empty canvas
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  }, [clearSelection]);

  const handleComponentSelect = useCallback((id: string) => {
    selectComponent(id, false);
  }, [selectComponent]);

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
  }, [components]);

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

    // Enforce minimum size
    const minSize = 20;
    if (newWidth < minSize) {
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

  const handleResizeEnd = useCallback(() => {
    setResizeState(null);
  }, []);

  // Add mouse event listeners for resize
  React.useEffect(() => {
    if (resizeState) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.classList.add('resizing');
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.classList.remove('resizing');
      };
    }
  }, [resizeState, handleResizeMove, handleResizeEnd]);

  return (
    <div className="flex-1 canvas-container relative overflow-hidden">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        {/* Canvas Background */}
        <div
          className="absolute inset-0 bg-white dark:bg-gray-800 shadow-inner"
          style={{
            backgroundImage: grid.showGrid ? `
              linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
            ` : undefined,
            backgroundSize: grid.showGrid ? `${grid.size}px ${grid.size}px` : undefined,
            margin: '20px',
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'top left',
            width: canvasSize.width,
            height: canvasSize.height,
            cursor: 'default',
          }}
          onClick={handleCanvasClick}
        >
          {/* Render Components */}
          {components
            .slice() // Create a copy to avoid mutating original array
            .sort((a, b) => {
              // Background color components always go to the back
              if (a.type === ComponentType.BACKGROUND_COLOR && b.type !== ComponentType.BACKGROUND_COLOR) return -1;
              if (b.type === ComponentType.BACKGROUND_COLOR && a.type !== ComponentType.BACKGROUND_COLOR) return 1;
              
              // Otherwise sort by z-index
              const aZ = a.zIndex || 1;
              const bZ = b.zIndex || 1;
              return aZ - bZ;
            })
            .map((component) => (
              <DraggableComponent
                key={component.id}
                component={component}
                onSelect={handleComponentSelect}
                onResizeStart={handleResizeStart}
              />
            ))}

          {/* Alignment Guides */}
          <AlignmentGuides
            guides={alignmentGuides}
            components={components}
            canvasSize={canvasSize}
          />

          {/* Canvas Info Overlay */}
          {components.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-2">🏟️</div>
                <p>Click components from the sidebar to add them</p>
                <p className="text-sm">Canvas: {canvasSize.width}×{canvasSize.height}</p>
                <p className="text-sm">Grid: {grid.enabled ? 'On' : 'Off'} ({grid.size}px)</p>
              </div>
            </div>
          )}
        </div>
      </DndContext>
    </div>
  );
}; 