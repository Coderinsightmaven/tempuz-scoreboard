import { useState, useCallback } from 'react';
import { DragStartEvent, DragMoveEvent, DragEndEvent } from '@dnd-kit/core';
import { useScoreboardStore } from '../stores/useScoreboardStore';
import { useCanvasStore } from '../stores/useCanvasStore';
import { detectAlignments } from '../utils/alignment';
import { snapToGrid } from '../utils/canvas';

/**
 * Hook that handles component drag operations on the canvas.
 * 
 * Features:
 * - Drag start/end handling
 * - Alignment guide detection during drag
 * - Alignment snapping (smart guides)
 * - Grid snapping (when alignment snapping is disabled)
 * - Canvas bounds constraint
 * - Auto-selection of dragged component
 * 
 * @returns Object with drag event handlers for DndContext
 */
export const useComponentDrag = () => {
  const {
    components,
    updateComponentPosition,
  } = useScoreboardStore();

  const {
    canvasSize,
    grid,
    selectedComponents,
    alignmentGuides,
    alignmentSnapping,
    selectComponent,
    startDrag,
    endDrag,
    setAlignmentGuides,
    clearAlignmentGuides,
  } = useCanvasStore();

  const [draggedComponentId, setDraggedComponentId] = useState<string | null>(null);

  /**
   * Handles the start of a drag operation.
   * 
   * Process:
   * 1. Records the component being dragged
   * 2. Updates canvas store drag state
   * 3. Auto-selects component if not already selected
   * 
   * @param event - Drag start event from @dnd-kit
   */
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

  /**
   * Handles drag movement (while dragging).
   * 
   * Process:
   * 1. Calculates new position based on drag delta
   * 2. Detects alignments with other components (if alignment snapping enabled)
   * 3. Updates alignment guides for visual feedback
   * 
   * @param event - Drag move event from @dnd-kit
   */
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { delta } = event;
    
    if (!draggedComponentId) return;
    
    const draggedComponent = components.find(c => c.id === draggedComponentId);
    if (!draggedComponent) return;
    
    // Only show alignment guides if alignment snapping is enabled
    if (alignmentSnapping) {
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
    } else {
      // Clear alignment guides if alignment snapping is disabled
      clearAlignmentGuides();
    }
  }, [draggedComponentId, components, alignmentSnapping, setAlignmentGuides, clearAlignmentGuides]);

  /**
   * Handles the end of a drag operation.
   * 
   * Process:
   * 1. Calculates final position from drag delta
   * 2. Applies alignment snapping (if enabled and alignment detected)
   * 3. Applies grid snapping (if enabled and no alignment snapping occurred)
   * 4. Constrains position to canvas bounds
   * 5. Updates component position in store
   * 
   * Snapping priority:
   * - Alignment snapping takes precedence over grid snapping
   * - Grid snapping only applies if alignment snapping didn't occur
   * 
   * @param event - Drag end event from @dnd-kit
   */
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event;
    endDrag();
    clearAlignmentGuides();
    setDraggedComponentId(null);

    // If no movement occurred, don't update position
    if (!delta.x && !delta.y) return;

    const component = components.find(c => c.id === active.id);
    if (!component) return;

    // Calculate new position from drag delta
    let newX = component.position.x + delta.x;
    let newY = component.position.y + delta.y;

    // Check for alignment snapping first (only if enabled)
    let alignmentSnapped = false;
    if (alignmentSnapping) {
      const newPosition = { x: newX, y: newY };
      const otherComponents = components.filter(c => c.id !== active.id);
      const alignmentResult = detectAlignments(component, newPosition, otherComponents);
      
      // Apply alignment snapping if detected
      if (alignmentResult.snapPosition) {
        if (alignmentResult.snapPosition.x !== undefined) {
          newX = alignmentResult.snapPosition.x;
          alignmentSnapped = true;
        }
        if (alignmentResult.snapPosition.y !== undefined) {
          newY = alignmentResult.snapPosition.y;
          alignmentSnapped = true;
        }
      }
    }
    
    // Apply grid snapping only if no alignment snapping occurred and grid snapping is enabled
    if (!alignmentSnapped && grid.snapToGrid && grid.enabled) {
      const gridSettings = { ...grid, color: '#000000', opacity: 0.1 };
      const snapped = snapToGrid({ x: newX, y: newY }, gridSettings);
      newX = snapped.x;
      newY = snapped.y;
    }

    // Constrain to canvas bounds
    // Ensure component doesn't go outside canvas boundaries
    newX = Math.max(0, Math.min(canvasSize.width - component.size.width, newX));
    newY = Math.max(0, Math.min(canvasSize.height - component.size.height, newY));

    // Update component position in store
    updateComponentPosition(active.id as string, { x: newX, y: newY });
  }, [components, grid, canvasSize, alignmentSnapping, updateComponentPosition, endDrag, clearAlignmentGuides]);

  return {
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  };
};
