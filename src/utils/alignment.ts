/**
 * Alignment detection utilities for smart component snapping.
 * 
 * Provides functions to detect when components align with each other during drag operations,
 * enabling visual guides and automatic snapping for better design precision.
 */
// src/utils/alignment.ts
import { ScoreboardComponent } from '../types/scoreboard';

/**
 * Represents an alignment guide line that should be displayed.
 */
export interface AlignmentGuide {
  /** Orientation of the guide line */
  type: 'vertical' | 'horizontal';
  /** Position of the guide line in pixels */
  position: number;
  /** IDs of components that align along this guide */
  componentIds: string[];
  /** Type of alignment (which edges/centers align) */
  snapType: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle';
}

/**
 * Result of alignment detection, containing guides and optional snap position.
 */
export interface AlignmentResult {
  /** Array of alignment guides to display */
  guides: AlignmentGuide[];
  /** Optional position to snap the dragged component to */
  snapPosition?: { x?: number; y?: number };
}

/**
 * Distance threshold in pixels for detecting alignments.
 * Components within this distance are considered aligned.
 */
const SNAP_THRESHOLD = 8; // pixels

/**
 * Detects alignment opportunities between a dragged component and other components.
 * 
 * Algorithm:
 * 1. Calculates edges and centers for dragged component at new position
 * 2. Compares with edges and centers of all other components
 * 3. Detects alignments within SNAP_THRESHOLD distance
 * 4. Creates alignment guides for visual feedback
 * 5. Calculates snap position if alignment detected
 * 
 * Alignment types detected:
 * - Vertical: left edges, right edges, centers, left-to-right, right-to-left
 * - Horizontal: top edges, bottom edges, centers, top-to-bottom, bottom-to-top
 * 
 * @param draggedComponent - The component being dragged
 * @param draggedPosition - The new position being dragged to
 * @param otherComponents - All other components to check alignment against
 * @returns AlignmentResult with guides and optional snap position
 */
export function detectAlignments(
  draggedComponent: ScoreboardComponent,
  draggedPosition: { x: number; y: number },
  otherComponents: ScoreboardComponent[]
): AlignmentResult {
  const guides: AlignmentGuide[] = [];
  let snapPosition: { x?: number; y?: number } = {};

  // Calculate edges and center for dragged component
  const draggedLeft = draggedPosition.x;
  const draggedRight = draggedPosition.x + draggedComponent.size.width;
  const draggedCenterX = draggedPosition.x + draggedComponent.size.width / 2;
  const draggedTop = draggedPosition.y;
  const draggedBottom = draggedPosition.y + draggedComponent.size.height;
  const draggedCenterY = draggedPosition.y + draggedComponent.size.height / 2;

  for (const component of otherComponents) {
    if (component.id === draggedComponent.id) continue;

    // Calculate edges and center for comparison component
    const compLeft = component.position.x;
    const compRight = component.position.x + component.size.width;
    const compCenterX = component.position.x + component.size.width / 2;
    const compTop = component.position.y;
    const compBottom = component.position.y + component.size.height;
    const compCenterY = component.position.y + component.size.height / 2;

    // Vertical alignments (left, right, center)
    
    // Left edge alignment
    if (Math.abs(draggedLeft - compLeft) <= SNAP_THRESHOLD) {
      guides.push({
        type: 'vertical',
        position: compLeft,
        componentIds: [draggedComponent.id, component.id],
        snapType: 'left'
      });
      snapPosition.x = compLeft;
    }

    // Right edge alignment
    if (Math.abs(draggedRight - compRight) <= SNAP_THRESHOLD) {
      guides.push({
        type: 'vertical',
        position: compRight,
        componentIds: [draggedComponent.id, component.id],
        snapType: 'right'
      });
      snapPosition.x = compRight - draggedComponent.size.width;
    }

    // Center alignment (vertical line)
    if (Math.abs(draggedCenterX - compCenterX) <= SNAP_THRESHOLD) {
      guides.push({
        type: 'vertical',
        position: compCenterX,
        componentIds: [draggedComponent.id, component.id],
        snapType: 'center'
      });
      snapPosition.x = compCenterX - draggedComponent.size.width / 2;
    }

    // Left to right edge alignment
    if (Math.abs(draggedLeft - compRight) <= SNAP_THRESHOLD) {
      guides.push({
        type: 'vertical',
        position: compRight,
        componentIds: [draggedComponent.id, component.id],
        snapType: 'left'
      });
      snapPosition.x = compRight;
    }

    // Right to left edge alignment
    if (Math.abs(draggedRight - compLeft) <= SNAP_THRESHOLD) {
      guides.push({
        type: 'vertical',
        position: compLeft,
        componentIds: [draggedComponent.id, component.id],
        snapType: 'right'
      });
      snapPosition.x = compLeft - draggedComponent.size.width;
    }

    // Horizontal alignments (top, bottom, middle)
    
    // Top edge alignment
    if (Math.abs(draggedTop - compTop) <= SNAP_THRESHOLD) {
      guides.push({
        type: 'horizontal',
        position: compTop,
        componentIds: [draggedComponent.id, component.id],
        snapType: 'top'
      });
      snapPosition.y = compTop;
    }

    // Bottom edge alignment
    if (Math.abs(draggedBottom - compBottom) <= SNAP_THRESHOLD) {
      guides.push({
        type: 'horizontal',
        position: compBottom,
        componentIds: [draggedComponent.id, component.id],
        snapType: 'bottom'
      });
      snapPosition.y = compBottom - draggedComponent.size.height;
    }

    // Middle alignment (horizontal line)
    if (Math.abs(draggedCenterY - compCenterY) <= SNAP_THRESHOLD) {
      guides.push({
        type: 'horizontal',
        position: compCenterY,
        componentIds: [draggedComponent.id, component.id],
        snapType: 'middle'
      });
      snapPosition.y = compCenterY - draggedComponent.size.height / 2;
    }

    // Top to bottom edge alignment
    if (Math.abs(draggedTop - compBottom) <= SNAP_THRESHOLD) {
      guides.push({
        type: 'horizontal',
        position: compBottom,
        componentIds: [draggedComponent.id, component.id],
        snapType: 'top'
      });
      snapPosition.y = compBottom;
    }

    // Bottom to top edge alignment
    if (Math.abs(draggedBottom - compTop) <= SNAP_THRESHOLD) {
      guides.push({
        type: 'horizontal',
        position: compTop,
        componentIds: [draggedComponent.id, component.id],
        snapType: 'bottom'
      });
      snapPosition.y = compTop - draggedComponent.size.height;
    }
  }

  // Remove duplicate guides
  const uniqueGuides = guides.filter((guide, index, self) =>
    index === self.findIndex(g => 
      g.type === guide.type && 
      g.position === guide.position && 
      g.snapType === guide.snapType
    )
  );

  return {
    guides: uniqueGuides,
    snapPosition: Object.keys(snapPosition).length > 0 ? snapPosition : undefined
  };
}

/**
 * Calculates the start and end positions for an alignment guide line.
 * 
 * The guide line should span from the topmost/bottommost (for vertical guides)
 * or leftmost/rightmost (for horizontal guides) edges of the aligned components.
 * 
 * @param guide - The alignment guide to calculate extents for
 * @param components - All components (to find the aligned ones)
 * @returns Object with start and end positions for the guide line
 */
export function getGuideExtents(
  guide: AlignmentGuide,
  components: ScoreboardComponent[]
): { start: number; end: number } {
  const relevantComponents = components.filter(c => 
    guide.componentIds.includes(c.id)
  );

  if (guide.type === 'vertical') {
    const tops = relevantComponents.map(c => c.position.y);
    const bottoms = relevantComponents.map(c => c.position.y + c.size.height);
    return {
      start: Math.min(...tops),
      end: Math.max(...bottoms)
    };
  } else {
    const lefts = relevantComponents.map(c => c.position.x);
    const rights = relevantComponents.map(c => c.position.x + c.size.width);
    return {
      start: Math.min(...lefts),
      end: Math.max(...rights)
    };
  }
} 