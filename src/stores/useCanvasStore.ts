/**
 * useCanvasStore - Canvas viewport and interaction state management store.
 * 
 * Manages:
 * - Canvas viewport (zoom, pan, size)
 * - Grid settings (enabled, size, snap to grid, visibility)
 * - Component selection (single and multi-select)
 * - Drag and resize state
 * - Alignment guides for component snapping
 * - Clipboard for copy/paste operations
 * 
 * This store handles all canvas-level interactions and viewport transformations.
 */
// src/stores/useCanvasStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AlignmentGuide } from '../utils/alignment';
import { ResizeHandle } from '../types/canvas';
import { ScoreboardComponent } from '../types/scoreboard';

interface CanvasState {
  canvasSize: { width: number; height: number };
  zoom: number;
  pan: { x: number; y: number };
  grid: {
    enabled: boolean;
    size: number;
    snapToGrid: boolean;
    showGrid: boolean;
  };
  selectedComponents: Set<string>;
  hoveredComponent: string | null;
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  isResizing: boolean;
  resizeHandle: ResizeHandle | null;
  resizedComponentId: string | null;
  viewportBounds: DOMRect | null;
  alignmentGuides: AlignmentGuide[];
  // Clipboard state
  clipboard: ScoreboardComponent[];
  // Alignment snapping control
  alignmentSnapping: boolean;
}

interface CanvasActions {
  setCanvasSize: (width: number, height: number) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  toggleSnapToGrid: () => void;
  toggleAlignmentSnapping: () => void;
  selectComponent: (id: string, multiSelect?: boolean) => void;
  selectMultipleComponents: (ids: string[]) => void;
  clearSelection: () => void;
  setHoveredComponent: (id: string | null) => void;
  startDrag: (offset: { x: number; y: number }) => void;
  endDrag: () => void;
  startResize: (componentId: string, handle: ResizeHandle) => void;
  endResize: () => void;
  setViewportBounds: (bounds: DOMRect) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: (canvasWidth: number, canvasHeight: number, viewportWidth: number, viewportHeight: number) => void;
  resetView: () => void;
  setAlignmentGuides: (guides: AlignmentGuide[]) => void;
  clearAlignmentGuides: () => void;
  // Clipboard actions
  setClipboard: (components: ScoreboardComponent[]) => void;
  clearClipboard: () => void;
}

export const useCanvasStore = create<CanvasState & CanvasActions>()(
  subscribeWithSelector((set) => ({
    // Initial state
    canvasSize: { width: 800, height: 600 },
    zoom: 1,
    pan: { x: 0, y: 0 },
    grid: {
      enabled: true,
      size: 20,
      snapToGrid: true,
      showGrid: true,
    },
    selectedComponents: new Set<string>(),
    hoveredComponent: null,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    isResizing: false,
    resizeHandle: null,
    resizedComponentId: null,
    viewportBounds: null,
    alignmentGuides: [],
    // Clipboard initial state
    clipboard: [],
    // Alignment snapping control
    alignmentSnapping: true,

    // === Canvas Viewport Management ===
    
    /**
     * Sets the canvas size (scoreboard dimensions).
     * 
     * @param width - Canvas width in pixels
     * @param height - Canvas height in pixels
     */
    setCanvasSize: (width: number, height: number) => 
      set(() => ({
        canvasSize: { width, height }
      })),
    
    /**
     * Sets the zoom level for the canvas viewport.
     * Clamps zoom between 0.1 (10%) and 5 (500%).
     * 
     * @param zoom - Zoom level (1.0 = 100%, 0.5 = 50%, 2.0 = 200%, etc.)
     */
    setZoom: (zoom: number) => 
      set(() => ({
        zoom: Math.max(0.1, Math.min(5, zoom))
      })),
    
    /**
     * Sets the pan (translation) offset for the canvas viewport.
     * 
     * @param x - X offset in pixels
     * @param y - Y offset in pixels
     */
    setPan: (x: number, y: number) => 
      set(() => ({
        pan: { x, y }
      })),
    
    // === Grid Management ===
    
    /**
     * Toggles grid visibility on/off.
     * Does not affect snap-to-grid functionality.
     */
    toggleGrid: () => 
      set((state) => ({
        grid: { ...state.grid, showGrid: !state.grid.showGrid }
      })),
    
    /**
     * Sets the grid cell size.
     * 
     * @param size - Grid cell size in pixels
     */
    setGridSize: (size: number) => 
      set((state) => ({
        grid: { ...state.grid, size }
      })),
    
    /**
     * Toggles snap-to-grid functionality.
     * When enabled, components snap to grid when moved.
     */
    toggleSnapToGrid: () => 
      set((state) => ({
        grid: { ...state.grid, snapToGrid: !state.grid.snapToGrid }
      })),
    
    /**
     * Toggles alignment snapping (smart guides).
     * When enabled, shows alignment guides and snaps components to align with others.
     * Clears alignment guides when disabled.
     */
    toggleAlignmentSnapping: () => 
      set((state) => {
        const newAlignmentSnapping = !state.alignmentSnapping;
        return {
          alignmentSnapping: newAlignmentSnapping,
          // Clear alignment guides when disabling alignment snapping
          alignmentGuides: newAlignmentSnapping ? state.alignmentGuides : []
        };
      }),
    
    // === Component Selection ===
    
    /**
     * Selects a component, with optional multi-select support.
     * 
     * @param id - The component ID to select
     * @param multiSelect - If true, toggles selection (adds/removes from selection)
     *                      If false, replaces current selection with this component
     */
    selectComponent: (id: string, multiSelect = false) => 
      set((state) => {
        const newSelectedComponents = new Set(state.selectedComponents);
        if (multiSelect) {
          if (newSelectedComponents.has(id)) {
            newSelectedComponents.delete(id);
          } else {
            newSelectedComponents.add(id);
          }
        } else {
          newSelectedComponents.clear();
          newSelectedComponents.add(id);
        }
        return { selectedComponents: newSelectedComponents };
      }),
    
    /**
     * Selects multiple components at once.
     * 
     * @param ids - Array of component IDs to select
     */
    selectMultipleComponents: (ids: string[]) =>
      set(() => ({
        selectedComponents: new Set(ids)
      })),
    
    /**
     * Clears all component selections.
     */
    clearSelection: () => 
      set(() => ({
        selectedComponents: new Set<string>()
      })),

    /**
     * Sets the currently hovered component (for visual feedback).
     * 
     * @param id - Component ID being hovered, or null if none
     */
    setHoveredComponent: (id: string | null) =>
      set(() => ({
        hoveredComponent: id
      })),
    
    // === Drag and Resize State ===
    
    /**
     * Starts a drag operation.
     * 
     * @param offset - Initial drag offset (x, y)
     */
    startDrag: (offset: { x: number; y: number }) => 
      set(() => ({
        isDragging: true,
        dragOffset: offset
      })),
    
    /**
     * Ends a drag operation and resets drag state.
     */
    endDrag: () => 
      set(() => ({
        isDragging: false,
        dragOffset: { x: 0, y: 0 }
      })),
    
    /**
     * Starts a resize operation on a component.
     * 
     * @param componentId - The ID of the component being resized
     * @param handle - Which resize handle is being used (corner or edge)
     */
    startResize: (componentId: string, handle: ResizeHandle) => 
      set(() => ({
        isResizing: true,
        resizeHandle: handle,
        resizedComponentId: componentId
      })),
    
    /**
     * Ends a resize operation and resets resize state.
     */
    endResize: () => 
      set(() => ({
        isResizing: false,
        resizeHandle: null,
        resizedComponentId: null
      })),
    
    /**
     * Sets the viewport bounds (for calculations like zoom to fit).
     * 
     * @param bounds - DOMRect representing the viewport bounds
     */
    setViewportBounds: (bounds: DOMRect) =>
      set(() => ({
        viewportBounds: bounds
      })),

    // === Zoom Controls ===
    
    /**
     * Zooms in by 20% (multiplies zoom by 1.2).
     * Clamps to maximum zoom of 5x (500%).
     */
    zoomIn: () =>
      set((state) => ({
        zoom: Math.min(5, state.zoom * 1.2)
      })),

    /**
     * Zooms out by 20% (divides zoom by 1.2).
     * Clamps to minimum zoom of 0.1x (10%).
     */
    zoomOut: () =>
      set((state) => ({
        zoom: Math.max(0.1, state.zoom / 1.2)
      })),

    /**
     * Zooms and pans to fit the canvas within the viewport.
     * Calculates optimal zoom to show entire canvas with 10% padding.
     * Centers the canvas in the viewport.
     * 
     * @param canvasWidth - Width of the canvas in pixels
     * @param canvasHeight - Height of the canvas in pixels
     * @param viewportWidth - Width of the viewport in pixels
     * @param viewportHeight - Height of the viewport in pixels
     */
    zoomToFit: (canvasWidth: number, canvasHeight: number, viewportWidth: number, viewportHeight: number) =>
      set(() => {
        const scaleX = viewportWidth / canvasWidth;
        const scaleY = viewportHeight / canvasHeight;
        const scale = Math.min(scaleX, scaleY) * 0.9;
        const zoom = Math.max(0.1, Math.min(5, scale));
        
        const scaledCanvasWidth = canvasWidth * zoom;
        const scaledCanvasHeight = canvasHeight * zoom;
        const pan = {
          x: (viewportWidth - scaledCanvasWidth) / 2,
          y: (viewportHeight - scaledCanvasHeight) / 2,
        };
        
        return { zoom, pan };
      }),

    /**
     * Resets the viewport to default (zoom 1x, pan 0,0).
     */
    resetView: () =>
      set(() => ({
        zoom: 1,
        pan: { x: 0, y: 0 }
      })),

    // === Alignment Guides ===
    
    /**
     * Sets the alignment guides to display.
     * Guides are shown when dragging components with alignment snapping enabled.
     * 
     * @param guides - Array of alignment guide objects
     */
    setAlignmentGuides: (guides: AlignmentGuide[]) =>
      set(() => ({
        alignmentGuides: guides
      })),

    /**
     * Clears all alignment guides.
     */
    clearAlignmentGuides: () =>
      set(() => ({
        alignmentGuides: []
      })),

    // === Clipboard Management ===
    
    /**
     * Sets the clipboard contents (components for paste).
     * 
     * @param components - Array of components to store in clipboard
     */
    setClipboard: (components: ScoreboardComponent[]) =>
      set(() => ({
        clipboard: components
      })),

    /**
     * Clears the clipboard.
     */
    clearClipboard: () =>
      set(() => ({
        clipboard: []
      })),
  }))
); 