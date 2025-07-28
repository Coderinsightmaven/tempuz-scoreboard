// src/utils/canvas.ts
import { Position, Size } from '../types/scoreboard';
import { CanvasTransform, GridSettings } from '../types/canvas';

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

export function snapToGrid(position: Position, gridSettings: GridSettings): Position {
  if (!gridSettings.snapToGrid || !gridSettings.enabled) {
    return position;
  }

  return {
    x: Math.round(position.x / gridSettings.size) * gridSettings.size,
    y: Math.round(position.y / gridSettings.size) * gridSettings.size,
  };
}

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

export function getDistance(point1: Position, point2: Position): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

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

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
} 