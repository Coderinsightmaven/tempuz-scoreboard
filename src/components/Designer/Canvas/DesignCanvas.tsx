import React, { useCallback } from 'react';
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
import { snapToGrid } from '../../../utils/canvas';

export const DesignCanvas: React.FC = () => {
  const {
    canvasSize,
    zoom,
    pan,
    grid,
    selectedComponents,
    selectComponent,
    clearSelection,
    startDrag,
    endDrag,
  } = useCanvasStore();

  const {
    components,
    updateComponentPosition,
  } = useScoreboardStore();

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
    startDrag({ x: 0, y: 0 });
    
    // Select the component being dragged if not already selected
    if (!selectedComponents.has(active.id as string)) {
      selectComponent(active.id as string);
    }
  }, [selectedComponents, selectComponent, startDrag]);

  const handleDragMove = useCallback((_event: DragMoveEvent) => {
    // This could be used for real-time preview updates
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event;
    endDrag();

    if (!delta.x && !delta.y) return;

    const component = components.find(c => c.id === active.id);
    if (!component) return;

    let newX = component.position.x + delta.x;
    let newY = component.position.y + delta.y;

    // Apply grid snapping if enabled
    if (grid.snapToGrid && grid.enabled) {
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
  }, [components, grid, canvasSize, updateComponentPosition, endDrag]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Clear selection when clicking on empty canvas
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  }, [clearSelection]);

  const handleComponentSelect = useCallback((id: string) => {
    selectComponent(id, false);
  }, [selectComponent]);

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
          {components.map((component) => (
            <DraggableComponent
              key={component.id}
              component={component}
              onSelect={handleComponentSelect}
            />
          ))}

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