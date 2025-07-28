import React from 'react';
import { useCanvasStore } from '../../stores/useCanvasStore';
import { useScoreboardStore } from '../../stores/useScoreboardStore';
import { ComponentType } from '../../types/scoreboard';
import { ColorPicker } from '../ui/ColorPicker';

interface PropertyPanelProps {
  isOpen: boolean;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ isOpen }) => {
  const { selectedComponents } = useCanvasStore();
  const { components, updateComponentData, updateComponentPosition, updateComponentSize, updateComponentStyle } = useScoreboardStore();
  
  // Get the selected component (only show properties if exactly one is selected)
  const selectedComponent = selectedComponents.size === 1 
    ? components.find(c => c.id === Array.from(selectedComponents)[0])
    : null;

  if (!isOpen || !selectedComponent) {
    return null;
  }

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    updateComponentPosition(selectedComponent.id, {
      ...selectedComponent.position,
      [axis]: value
    });
  };

  const handleSizeChange = (dimension: 'width' | 'height', value: number) => {
    updateComponentSize(selectedComponent.id, {
      ...selectedComponent.size,
      [dimension]: Math.max(10, value) // Minimum size of 10px
    });
  };

  const handleStyleChange = (property: string, value: any) => {
    updateComponentStyle(selectedComponent.id, {
      ...selectedComponent.style,
      [property]: value
    });
  };

  const handleDataChange = (property: string, value: any) => {
    updateComponentData(selectedComponent.id, {
      ...selectedComponent.data,
      [property]: value
    });
  };

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number; a: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      a: 1
    } : { r: 0, g: 0, b: 0, a: 1 };
  };

  // Helper function to convert RGB to hex
  const rgbToHex = (rgb: { r: number; g: number; b: number; a?: number }): string => {
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  };

  // Helper function to handle color change
  const handleColorChange = (property: string, color: { r: number; g: number; b: number; a?: number }) => {
    const hexColor = rgbToHex(color);
    handleStyleChange(property, hexColor);
  };

  const renderDataProperties = () => {
    switch (selectedComponent.type) {
      case ComponentType.TEXT:
      case ComponentType.TEAM_NAME:
        return (
          <div className="form-group">
            <label className="form-label">Text Content</label>
            <input
              type="text"
              value={selectedComponent.data.text || ''}
              onChange={(e) => handleDataChange('text', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        );
      
      case ComponentType.SCORE:
        return (
          <div className="space-y-3">
            <div className="form-group">
              <label className="form-label">Score Value</label>
              <input
                type="number"
                value={selectedComponent.data.value || 0}
                onChange={(e) => handleDataChange('value', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Team</label>
              <select
                value={selectedComponent.data.teamId || 'home'}
                onChange={(e) => handleDataChange('teamId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="home">Home</option>
                <option value="away">Away</option>
              </select>
            </div>
          </div>
        );
      
      case ComponentType.TIMER:
        return (
          <div className="space-y-3">
            <div className="form-group">
              <label className="form-label">Time Value</label>
              <input
                type="text"
                value={selectedComponent.data.value || '00:00'}
                onChange={(e) => handleDataChange('value', e.target.value)}
                placeholder="MM:SS"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Format</label>
              <select
                value={selectedComponent.data.format || 'mm:ss'}
                onChange={(e) => handleDataChange('format', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="mm:ss">MM:SS</option>
                <option value="hh:mm:ss">HH:MM:SS</option>
                <option value="ss">Seconds</option>
              </select>
            </div>
          </div>
        );
      
      case ComponentType.PERIOD:
        return (
          <div className="form-group">
            <label className="form-label">Period/Quarter</label>
            <input
              type="number"
              value={selectedComponent.data.value || 1}
              onChange={(e) => handleDataChange('value', parseInt(e.target.value) || 1)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        );
      
      case ComponentType.IMAGE:
        return (
          <div className="form-group">
            <label className="form-label">Image ID</label>
            <input
              type="text"
              value={selectedComponent.data.imageId || ''}
              onChange={(e) => handleDataChange('imageId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <aside className="property-panel w-80 overflow-y-auto">
      <div className="panel-header">
        <h3>Properties</h3>
        <span className="text-xs text-gray-500">
          {selectedComponent.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      </div>
      
      <div className="panel-content">
        {/* Component Data Properties */}
        {renderDataProperties()}
        
        {/* Position Properties */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1">Position</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">X</label>
              <input
                type="number"
                value={Math.round(selectedComponent.position.x)}
                onChange={(e) => handlePositionChange('x', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Y</label>
              <input
                type="number"
                value={Math.round(selectedComponent.position.y)}
                onChange={(e) => handlePositionChange('y', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
        
        {/* Size Properties */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1">Size</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Width</label>
              <input
                type="number"
                value={Math.round(selectedComponent.size.width)}
                onChange={(e) => handleSizeChange('width', parseInt(e.target.value) || 10)}
                min="10"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Height</label>
              <input
                type="number"
                value={Math.round(selectedComponent.size.height)}
                onChange={(e) => handleSizeChange('height', parseInt(e.target.value) || 10)}
                min="10"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
        
        {/* Style Properties */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1">Appearance</h4>
          
          {/* Background Color */}
          <div className="form-group">
            <label className="form-label">Background Color</label>
            <ColorPicker
              color={hexToRgb(selectedComponent.style.backgroundColor || '#ffffff')}
              onChange={(color) => handleColorChange('backgroundColor', color)}
            />
          </div>
          
          {/* Text Color */}
          <div className="form-group">
            <label className="form-label">Text Color</label>
            <ColorPicker
              color={hexToRgb(selectedComponent.style.textColor || '#000000')}
              onChange={(color) => handleColorChange('textColor', color)}
            />
          </div>
          
          {/* Font Size */}
          <div className="form-group">
            <label className="form-label">Font Size</label>
            <input
              type="number"
              value={selectedComponent.style.fontSize || 16}
              onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value) || 16)}
              min="8"
              max="72"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          {/* Font Weight */}
          <div className="form-group">
            <label className="form-label">Font Weight</label>
            <select
              value={selectedComponent.style.fontWeight || 'normal'}
              onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
              <option value="lighter">Light</option>
            </select>
          </div>
          
          {/* Text Alignment */}
          <div className="form-group">
            <label className="form-label">Text Align</label>
            <select
              value={selectedComponent.style.textAlign || 'center'}
              onChange={(e) => handleStyleChange('textAlign', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
          
          {/* Border */}
          <div className="form-group">
            <label className="form-label">Border Width</label>
            <input
              type="number"
              value={selectedComponent.style.borderWidth || 1}
              onChange={(e) => handleStyleChange('borderWidth', parseInt(e.target.value) || 0)}
              min="0"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          {/* Border Color */}
          <div className="form-group">
            <label className="form-label">Border Color</label>
            <ColorPicker
              color={hexToRgb(selectedComponent.style.borderColor || '#000000')}
              onChange={(color) => handleColorChange('borderColor', color)}
            />
          </div>
          
          {/* Border Radius */}
          <div className="form-group">
            <label className="form-label">Border Radius</label>
            <input
              type="number"
              value={selectedComponent.style.borderRadius || 0}
              onChange={(e) => handleStyleChange('borderRadius', parseInt(e.target.value) || 0)}
              min="0"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          {/* Opacity */}
          <div className="form-group">
            <label className="form-label">Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={selectedComponent.style.opacity || 1}
              onChange={(e) => handleStyleChange('opacity', parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-gray-500">{Math.round((selectedComponent.style.opacity || 1) * 100)}%</span>
          </div>
        </div>
        
        {/* Component Actions */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1">Actions</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleStyleChange('visible', !selectedComponent.visible)}
              className={`px-3 py-2 text-xs rounded-md transition-colors ${
                selectedComponent.visible 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}
            >
              {selectedComponent.visible ? 'Visible' : 'Hidden'}
            </button>
            
            <button
              onClick={() => handleStyleChange('locked', !selectedComponent.locked)}
              className={`px-3 py-2 text-xs rounded-md transition-colors ${
                selectedComponent.locked 
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              {selectedComponent.locked ? 'Locked' : 'Unlocked'}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};