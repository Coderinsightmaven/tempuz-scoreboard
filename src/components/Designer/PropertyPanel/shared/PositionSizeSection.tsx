import React from 'react';
import { ScoreboardComponent } from '../../../../types/scoreboard';

interface PositionSizeSectionProps {
  /** The component being edited */
  component: ScoreboardComponent;
  /** Callback when position changes */
  onPositionChange: (axis: 'x' | 'y', value: number) => void;
  /** Callback when size changes */
  onSizeChange: (dimension: 'width' | 'height', value: number) => void;
}

/**
 * PositionSizeSection displays controls for editing component position and size.
 * 
 * Features:
 * - X/Y position inputs with arrow key support
 * - Width/Height size inputs with minimum size constraint (10px)
 * - Arrow keys increment/decrement values
 */
export const PositionSizeSection: React.FC<PositionSizeSectionProps> = ({
  component,
  onPositionChange,
  onSizeChange,
}) => {
  return (
    <>
      {/* Position */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Position</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">X</label>
            <input
              type="number"
              value={Math.round(component.position.x)}
              onChange={(e) => onPositionChange('x', parseInt(e.target.value) || 0)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  onPositionChange('x', Math.round(component.position.x) + 1);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  onPositionChange('x', Math.round(component.position.x) - 1);
                }
              }}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Y</label>
            <input
              type="number"
              value={Math.round(component.position.y)}
              onChange={(e) => onPositionChange('y', parseInt(e.target.value) || 0)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  onPositionChange('y', Math.round(component.position.y) + 1);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  onPositionChange('y', Math.round(component.position.y) - 1);
                }
              }}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Size */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Size</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
            <input
              type="number"
              value={Math.round(component.size.width)}
              onChange={(e) => onSizeChange('width', parseInt(e.target.value) || 0)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  onSizeChange('width', Math.round(component.size.width) + 1);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  onSizeChange('width', Math.max(10, Math.round(component.size.width) - 1));
                }
              }}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
            <input
              type="number"
              value={Math.round(component.size.height)}
              onChange={(e) => onSizeChange('height', parseInt(e.target.value) || 0)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  onSizeChange('height', Math.round(component.size.height) + 1);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  onSizeChange('height', Math.max(10, Math.round(component.size.height) - 1));
                }
              }}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </>
  );
};
