/**
 * AlignmentGuides - Renders visual alignment guide lines on the canvas.
 * 
 * Displays guide lines when components align during drag operations.
 * Guides help users align components precisely with each other.
 * 
 * Features:
 * - Vertical guides (for left/right/center alignment)
 * - Horizontal guides (for top/bottom/middle alignment)
 * - Extends beyond component bounds for better visibility
 * - Only visible when alignment snapping is enabled
 */
// src/components/Designer/Canvas/AlignmentGuides.tsx
import React from 'react';
import { AlignmentGuide } from '../../../utils/alignment';
import { ScoreboardComponent } from '../../../types/scoreboard';
import { getGuideExtents } from '../../../utils/alignment';

interface AlignmentGuidesProps {
  /** Array of alignment guides to display */
  guides: AlignmentGuide[];
  /** All components (for calculating guide extents) */
  components: ScoreboardComponent[];
  /** Canvas dimensions (for constraining guide lines) */
  canvasSize: { width: number; height: number };
}

export const AlignmentGuides: React.FC<AlignmentGuidesProps> = ({
  guides,
  components,
  canvasSize,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {guides.map((guide, index) => {
        const extents = getGuideExtents(guide, components);
        
        if (guide.type === 'vertical') {
          return (
            <div
              key={`${guide.type}-${guide.position}-${index}`}
              className="absolute alignment-guide"
              style={{
                left: guide.position - 0.5,
                top: Math.max(0, extents.start - 20),
                width: 1,
                height: Math.min(canvasSize.height, extents.end + 40) - Math.max(0, extents.start - 20),
                zIndex: 1000,
              }}
            />
          );
        } else {
          return (
            <div
              key={`${guide.type}-${guide.position}-${index}`}
              className="absolute alignment-guide"
              style={{
                left: Math.max(0, extents.start - 20),
                top: guide.position - 0.5,
                width: Math.min(canvasSize.width, extents.end + 40) - Math.max(0, extents.start - 20),
                height: 1,
                zIndex: 1000,
              }}
            />
          );
        }
      })}
    </div>
  );
}; 