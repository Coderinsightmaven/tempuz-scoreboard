/**
 * DesignCanvas - Main canvas component for the scoreboard designer.
 * 
 * Features:
 * - Drag-and-drop component positioning using @dnd-kit
 * - Component resize with 8 handles (corners and edges)
 * - Alignment guides for smart snapping
 * - Grid overlay and snap-to-grid
 * - Zoom and pan viewport controls
 * - Component selection and rendering
 * 
 * The canvas uses DndContext for drag operations and manages component rendering
 * with proper z-index sorting.
 */
import React, { useCallback } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { useScoreboardStore } from '../../../stores/useScoreboardStore';
import { useCanvasStore } from '../../../stores/useCanvasStore';
import { useComponentDrag } from '../../../hooks/useComponentDrag';
import { useComponentResize } from '../../../hooks/useComponentResize';
import { DraggableComponent } from './DraggableComponent';
import { AlignmentGuides } from './AlignmentGuides';
import { ResizeHandle } from '../../../types/canvas';

export const DesignCanvas: React.FC = () => {
  const {
    canvasSize,
    zoom,
    pan,
    grid,
    alignmentGuides,
    alignmentSnapping,
    selectComponent,
    clearSelection,
  } = useCanvasStore();

  const { components } = useScoreboardStore();

  // Use extracted drag hook
  const { handleDragStart, handleDragMove, handleDragEnd } = useComponentDrag();

  // Use extracted resize hook
  const { handleResizeStart } = useComponentResize();

  /**
   * Sensor configuration for @dnd-kit drag-and-drop.
   * PointerSensor requires 8px movement before activation to distinguish drags from clicks.
   * KeyboardSensor enables keyboard-based dragging for accessibility.
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  );

  /**
   * Handles clicks on the empty canvas area.
   * Clears component selection when clicking on canvas background.
   */
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Clear selection when clicking on empty canvas
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  }, [clearSelection]);

  /**
   * Handles component selection when clicking on a component.
   * 
   * @param id - The component ID to select
   */
  const handleComponentSelect = useCallback((id: string) => {
    selectComponent(id, false);
  }, [selectComponent]);

  // Add keyboard event listener for ESC key to clear selection
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        clearSelection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [clearSelection]);

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
            // Sort components by zIndex (background components first), then by creation order
            .sort((a, b) => {
              // First by zIndex
              const zIndexDiff = (a.zIndex || 0) - (b.zIndex || 0);
              if (zIndexDiff !== 0) return zIndexDiff;
              
              // Then by creation order (id) for consistent rendering
              return a.id.localeCompare(b.id);
            })
            .map((component) => (
              <DraggableComponent
                key={component.id}
                component={component}
                onSelect={handleComponentSelect}
                onResizeStart={handleResizeStart}
              />
            ))}

          {/* Alignment Guides - only show if alignment snapping is enabled */}
          {alignmentSnapping && (
            <AlignmentGuides
              guides={alignmentGuides}
              components={components}
              canvasSize={canvasSize}
            />
          )}

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