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

    // Actions
    setCanvasSize: (width: number, height: number) => 
      set(() => ({
        canvasSize: { width, height }
      })),
    
    setZoom: (zoom: number) => 
      set(() => ({
        zoom: Math.max(0.1, Math.min(5, zoom))
      })),
    
    setPan: (x: number, y: number) => 
      set(() => ({
        pan: { x, y }
      })),
    
    toggleGrid: () => 
      set((state) => ({
        grid: { ...state.grid, showGrid: !state.grid.showGrid }
      })),
    
    setGridSize: (size: number) => 
      set((state) => ({
        grid: { ...state.grid, size }
      })),
    
    toggleSnapToGrid: () => 
      set((state) => ({
        grid: { ...state.grid, snapToGrid: !state.grid.snapToGrid }
      })),
    
    toggleAlignmentSnapping: () => 
      set((state) => {
        const newAlignmentSnapping = !state.alignmentSnapping;
        return {
          alignmentSnapping: newAlignmentSnapping,
          // Clear alignment guides when disabling alignment snapping
          alignmentGuides: newAlignmentSnapping ? state.alignmentGuides : []
        };
      }),
    
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
    
    selectMultipleComponents: (ids: string[]) =>
      set(() => ({
        selectedComponents: new Set(ids)
      })),
    
    clearSelection: () => 
      set(() => ({
        selectedComponents: new Set<string>()
      })),

    setHoveredComponent: (id: string | null) =>
      set(() => ({
        hoveredComponent: id
      })),
    
    startDrag: (offset: { x: number; y: number }) => 
      set(() => ({
        isDragging: true,
        dragOffset: offset
      })),
    
    endDrag: () => 
      set(() => ({
        isDragging: false,
        dragOffset: { x: 0, y: 0 }
      })),
    
    startResize: (componentId: string, handle: ResizeHandle) => 
      set(() => ({
        isResizing: true,
        resizeHandle: handle,
        resizedComponentId: componentId
      })),
    
    endResize: () => 
      set(() => ({
        isResizing: false,
        resizeHandle: null,
        resizedComponentId: null
      })),
    
    setViewportBounds: (bounds: DOMRect) =>
      set(() => ({
        viewportBounds: bounds
      })),

    zoomIn: () =>
      set((state) => ({
        zoom: Math.min(5, state.zoom * 1.2)
      })),

    zoomOut: () =>
      set((state) => ({
        zoom: Math.max(0.1, state.zoom / 1.2)
      })),

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

          resetView: () =>
        set(() => ({
          zoom: 1,
          pan: { x: 0, y: 0 }
        })),

      setAlignmentGuides: (guides: AlignmentGuide[]) =>
        set(() => ({
          alignmentGuides: guides
        })),

      clearAlignmentGuides: () =>
        set(() => ({
          alignmentGuides: []
        })),

      // Clipboard actions
      setClipboard: (components: ScoreboardComponent[]) =>
        set(() => ({
          clipboard: components
        })),

      clearClipboard: () =>
        set(() => ({
          clipboard: []
        })),
  }))
); 