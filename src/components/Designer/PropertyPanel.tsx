import React, { useState } from 'react';
import { useScoreboardStore } from '../../stores/useScoreboardStore';
import { useCanvasStore } from '../../stores/useCanvasStore';
import { useImageStore } from '../../stores/useImageStore';
import { ComponentType } from '../../types/scoreboard';
import { ImageManager } from '../ui/ImageManager';
import { ColorPicker } from '../ui/ColorPicker';

export const PropertyPanel: React.FC = () => {
  const { components, updateComponentData, updateComponentStyle, removeComponent } = useScoreboardStore();
  const { selectedComponents } = useCanvasStore();
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);

  // Get the selected component (only show properties if exactly one is selected)
  const selectedComponent = selectedComponents.size === 1 
    ? components.find(c => c.id === Array.from(selectedComponents)[0])
    : null;

  if (!selectedComponent) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="text-center text-gray-500 py-8">
          Select a component to edit its properties
        </div>
      </div>
    );
  }

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    updateComponentData(selectedComponent.id, {
      position: {
        ...selectedComponent.position,
        [axis]: value
      }
    });
  };

  const handleSizeChange = (dimension: 'width' | 'height', value: number) => {
    updateComponentData(selectedComponent.id, {
      size: {
        ...selectedComponent.size,
        [dimension]: Math.max(10, value) // Minimum size of 10px
      }
    });
  };

  const handleStyleChange = (property: string, value: any) => {
    updateComponentStyle(selectedComponent.id, { [property]: value });
  };

  const handleDataChange = (property: string, value: any) => {
    updateComponentData(selectedComponent.id, { [property]: value });
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

  // Handle component deletion
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this component?')) {
      removeComponent(selectedComponent.id);
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <h3 className="text-lg font-medium text-gray-900">
            {selectedComponent.type 
              ? selectedComponent.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()) 
              : 'Component'} Properties
          </h3>
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </div>

        {/* Position */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Position</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">X</label>
              <input
                type="number"
                value={Math.round(selectedComponent.position.x)}
                onChange={(e) => handlePositionChange('x', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Y</label>
              <input
                type="number"
                value={Math.round(selectedComponent.position.y)}
                onChange={(e) => handlePositionChange('y', parseInt(e.target.value) || 0)}
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
                value={Math.round(selectedComponent.size.width)}
                onChange={(e) => handleSizeChange('width', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
              <input
                type="number"
                value={Math.round(selectedComponent.size.height)}
                onChange={(e) => handleSizeChange('height', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Style */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Style</h4>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Background Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={selectedComponent.style.backgroundColor === 'transparent' ? '#ffffff' : (selectedComponent.style.backgroundColor || '#ffffff')}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="w-16 h-8 rounded border border-gray-300"
              />
              <button
                onClick={() => handleStyleChange('backgroundColor', 'transparent')}
                className={`px-3 py-1 text-xs rounded border ${
                  selectedComponent.style.backgroundColor === 'transparent' 
                    ? 'bg-blue-100 text-blue-800 border-blue-300' 
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
              >
                Transparent
              </button>
            </div>
            {selectedComponent.style.backgroundColor === 'transparent' && (
              <div className="text-xs text-gray-500 mt-1">Background is transparent</div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Border Width</label>
            <input
              type="number"
              min="0"
              value={selectedComponent.style.borderWidth || 0}
              onChange={(e) => handleStyleChange('borderWidth', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Border Color</label>
            <input
              type="color"
              value={selectedComponent.style.borderColor || '#000000'}
              onChange={(e) => handleStyleChange('borderColor', e.target.value)}
              className="w-full h-8 rounded border border-gray-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Border Radius</label>
            <input
              type="number"
              min="0"
              value={selectedComponent.style.borderRadius || 0}
              onChange={(e) => handleStyleChange('borderRadius', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={selectedComponent.style.opacity || 1}
              onChange={(e) => handleStyleChange('opacity', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500 text-center">{Math.round((selectedComponent.style.opacity || 1) * 100)}%</div>
          </div>
        </div>

        {/* Component Data Properties */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Component Data</h4>
          {renderDataProperties()}
        </div>
      </div>

      {isImageManagerOpen && (
        <ImageManager
          isOpen={isImageManagerOpen}
          onClose={() => setIsImageManagerOpen(false)}
          selectMode={true}
          onSelectImage={(image) => {
            updateComponentData(selectedComponent.id, { imageId: image.id });
            setIsImageManagerOpen(false);
          }}
        />
      )}
    </div>
  );

  function renderDataProperties() {
    if (!selectedComponent) return null;

    switch (selectedComponent.type) {
      case ComponentType.BACKGROUND:
        return <BackgroundComponentProperties />;
      case ComponentType.LOGO:
        return <LogoComponentProperties />;
      case ComponentType.TEXT:
        return <TextComponentProperties />;
      default:
        return <div className="text-sm text-gray-500">No properties available</div>;
    }
  }

  function BackgroundComponentProperties() {
    const { images } = useImageStore();
    const selectedImage = images.find(img => img.id === selectedComponent?.data.imageId);

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Background Image
          </label>
          {selectedImage ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <img 
                  src={selectedImage.thumbnail} 
                  alt={selectedImage.name}
                  className="w-12 h-12 object-cover rounded border"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{selectedImage.name}</div>
                  <div className="text-xs text-gray-500">Background Image</div>
                </div>
              </div>
              <button
                onClick={() => setIsImageManagerOpen(true)}
                className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Change Background
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsImageManagerOpen(true)}
              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Select Background
            </button>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scale Mode
          </label>
          <select
            value={selectedComponent?.data.scaleMode || 'cover'}
            onChange={(e) => handleDataChange('scaleMode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="cover">Cover (Fill entire area)</option>
            <option value="contain">Contain (Fit within area)</option>
            <option value="stretch">Stretch (Fill ignoring aspect ratio)</option>
            <option value="original">Original Size</option>
          </select>
        </div>
      </div>
    );
  }

  function LogoComponentProperties() {
    const { images } = useImageStore();
    const selectedImage = images.find(img => img.id === selectedComponent?.data.imageId);

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo Image
          </label>
          {selectedImage ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <img 
                  src={selectedImage.thumbnail} 
                  alt={selectedImage.name}
                  className="w-12 h-12 object-cover rounded border"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{selectedImage.name}</div>
                  <div className="text-xs text-gray-500">Logo Image</div>
                </div>
              </div>
              <button
                onClick={() => setIsImageManagerOpen(true)}
                className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Change Logo
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsImageManagerOpen(true)}
              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Select Logo
            </button>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scale Mode
          </label>
          <select
            value={selectedComponent?.data.scaleMode || 'contain'}
            onChange={(e) => handleDataChange('scaleMode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="cover">Cover (Fill entire area)</option>
            <option value="contain">Contain (Fit within area)</option>
            <option value="stretch">Stretch (Fill ignoring aspect ratio)</option>
            <option value="original">Original Size</option>
          </select>
        </div>
      </div>
    );
  }

  function TextComponentProperties() {
    const [localText, setLocalText] = useState(selectedComponent?.data.text || '');

    // Update local state when selected component changes
    React.useEffect(() => {
      setLocalText(selectedComponent?.data.text || '');
    }, [selectedComponent?.id, selectedComponent?.data.text]);

    const handleTextBlur = () => {
      if (localText !== selectedComponent?.data.text) {
        handleDataChange('text', localText);
      }
    };

    const handleTextKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        handleTextBlur();
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Content
          </label>
          <textarea
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            onBlur={handleTextBlur}
            onKeyDown={handleTextKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter text... (Ctrl+Enter to apply immediately)"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Font Size: {selectedComponent?.style.fontSize || 16}px
          </label>
          <input
            type="range"
            min="8"
            max="72"
            value={selectedComponent?.style.fontSize || 16}
            onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Color
          </label>
          <input
            type="color"
            value={selectedComponent?.style.textColor || '#ffffff'}
            onChange={(e) => handleStyleChange('textColor', e.target.value)}
            className="w-full h-10 rounded border border-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Align
          </label>
          <select
            value={selectedComponent?.style.textAlign || 'center'}
            onChange={(e) => handleStyleChange('textAlign', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Font Weight
          </label>
          <select
            value={selectedComponent?.style.fontWeight || 'normal'}
            onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
            <option value="lighter">Light</option>
          </select>
        </div>
      </div>
    );
  }
};