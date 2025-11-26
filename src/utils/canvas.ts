/**
 * Canvas utility functions for coordinate transformations and calculations.
 * 
 * Provides functions for:
 * - Converting between screen and canvas coordinates
 * - Grid snapping
 * - Boundary constraints
 * - Geometric calculations (distance, bounding boxes, point-in-rect)
 * - Selection rectangle calculations
 * - Point rotation
 */
// src/utils/canvas.ts
import { Position, Size } from '../types/scoreboard';
import { CanvasTransform, GridSettings } from '../types/canvas';

/**
 * Converts a screen coordinate to canvas coordinate.
 * 
 * Accounts for:
 * - Viewport offset (viewportBounds)
 * - Canvas pan (translateX, translateY)
 * - Canvas zoom (scale)
 * 
 * @param screenPoint - Point in screen coordinates (pixels from viewport origin)
 * @param transform - Canvas transformation (zoom, pan)
 * @param viewportBounds - Viewport bounding rectangle
 * @returns Point in canvas coordinates
 */
export function screenToCanvas(
  screenPoint: Position,
  transform: CanvasTransform,
  viewportBounds: DOMRect
): Position {
  return {
    x: (screenPoint.x - viewportBounds.left - transform.translateX) / transform.scale,
    y: (screenPoint.y - viewportBounds.top - transform.translateY) / transform.scale,
  };
}

/**
 * Converts a canvas coordinate to screen coordinate.
 * 
 * Applies inverse transformation of screenToCanvas.
 * 
 * @param canvasPoint - Point in canvas coordinates
 * @param transform - Canvas transformation (zoom, pan)
 * @param viewportBounds - Viewport bounding rectangle
 * @returns Point in screen coordinates (pixels from viewport origin)
 */
export function canvasToScreen(
  canvasPoint: Position,
  transform: CanvasTransform,
  viewportBounds: DOMRect
): Position {
  return {
    x: canvasPoint.x * transform.scale + transform.translateX + viewportBounds.left,
    y: canvasPoint.y * transform.scale + transform.translateY + viewportBounds.top,
  };
}

/**
 * Snaps a position to the nearest grid point.
 * 
 * Algorithm:
 * - Divides position by grid size
 * - Rounds to nearest integer
 * - Multiplies back by grid size
 * 
 * @param position - Position to snap
 * @param gridSettings - Grid configuration (size, enabled, snapToGrid)
 * @returns Snapped position, or original position if grid snapping is disabled
 */
export function snapToGrid(position: Position, gridSettings: GridSettings): Position {
  if (!gridSettings.snapToGrid || !gridSettings.enabled) {
    return position;
  }

  return {
    x: Math.round(position.x / gridSettings.size) * gridSettings.size,
    y: Math.round(position.y / gridSettings.size) * gridSettings.size,
  };
}

/**
 * Constrains a position to keep a component within canvas bounds.
 * 
 * Ensures the component doesn't go outside the canvas boundaries.
 * 
 * @param position - Desired position
 * @param size - Size of the component
 * @param canvasSize - Size of the canvas
 * @returns Constrained position that keeps component within bounds
 */
export function constrainToCanvas(
  position: Position,
  size: Size,
  canvasSize: Size
): Position {
  return {
    x: Math.max(0, Math.min(canvasSize.width - size.width, position.x)),
    y: Math.max(0, Math.min(canvasSize.height - size.height, position.y)),
  };
}

/**
 * Calculates the Euclidean distance between two points.
 * 
 * @param point1 - First point
 * @param point2 - Second point
 * @returns Distance in pixels
 */
export function getDistance(point1: Position, point2: Position): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates the bounding rectangle that contains all given positions and sizes.
 * 
 * Finds the smallest rectangle that encompasses all components.
 * 
 * @param positions - Array of component positions
 * @param sizes - Array of component sizes (must match positions array length)
 * @returns Bounding rectangle (x, y, width, height)
 * 
 * Edge case: Returns zero-size rectangle at origin if positions array is empty.
 */
export function getBoundingRect(positions: Position[], sizes: Size[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (positions.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  positions.forEach((pos, index) => {
    const size = sizes[index] || { width: 0, height: 0 };
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + size.width);
    maxY = Math.max(maxY, pos.y + size.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Checks if a point is inside a rectangle.
 * 
 * @param point - Point to check
 * @param rect - Rectangle to check against
 * @returns true if point is inside rectangle, false otherwise
 */
export function isPointInRect(
  point: Position,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Calculates selection rectangle bounds from start and current points.
 * 
 * Handles dragging in any direction (up/down, left/right).
 * 
 * @param startPoint - Point where selection started
 * @param currentPoint - Current mouse position
 * @returns Normalized rectangle (always positive width/height)
 */
export function getSelectionBounds(
  startPoint: Position,
  currentPoint: Position
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const x = Math.min(startPoint.x, currentPoint.x);
  const y = Math.min(startPoint.y, currentPoint.y);
  const width = Math.abs(currentPoint.x - startPoint.x);
  const height = Math.abs(currentPoint.y - startPoint.y);

  return { x, y, width, height };
}

/**
 * Rotates a point around a center point by a given angle.
 * 
 * Uses standard 2D rotation matrix:
 * x' = center.x + (x - center.x) * cos(angle) - (y - center.y) * sin(angle)
 * y' = center.y + (x - center.x) * sin(angle) + (y - center.y) * cos(angle)
 * 
 * @param point - Point to rotate
 * @param center - Center of rotation
 * @param angleRadians - Rotation angle in radians
 * @returns Rotated point position
 */
export function rotatePoint(
  point: Position,
  center: Position,
  angleRadians: number
): Position {
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * Normalizes a rectangle to ensure positive width and height.
 * 
 * If width or height is negative, adjusts x/y and makes dimensions positive.
 * Useful for selection rectangles that can be drawn in any direction.
 * 
 * @param rect - Rectangle that may have negative width/height
 * @returns Normalized rectangle with positive width and height
 */
export function normalizeRect(rect: {
  x: number;
  y: number;
  width: number;
  height: number;
}): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return {
    x: rect.width < 0 ? rect.x + rect.width : rect.x,
    y: rect.height < 0 ? rect.y + rect.height : rect.y,
    width: Math.abs(rect.width),
    height: Math.abs(rect.height),
  };
}

/**
 * Clamps a value between a minimum and maximum.
 * 
 * @param value - Value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value (guaranteed to be between min and max)
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
} 