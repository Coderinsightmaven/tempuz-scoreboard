// src/components/ui/ColorPicker.tsx
import React from 'react';

interface ColorPickerProps {
  color: { r: number; g: number; b: number; a?: number };
  onChange: (color: { r: number; g: number; b: number; a?: number }) => void;
  label?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  label = "Color"
}) => {
  const handleColorChange = (component: 'r' | 'g' | 'b' | 'a', value: number) => {
    const newColor = { ...color };
    newColor[component] = Math.max(0, Math.min(component === 'a' ? 1 : 255, value));
    onChange(newColor);
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const handleHexChange = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (rgb) {
      onChange({ ...rgb, a: color.a });
    }
  };

  const currentHex = rgbToHex(color.r, color.g, color.b);
  const currentRgba = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a || 1})`;

  return (
    <div className="space-y-3">
      <label className="form-label">{label}</label>
      
      {/* Color Preview */}
      <div 
        className="w-full h-8 rounded border border-border"
        style={{ backgroundColor: currentRgba }}
      />
      
      {/* Hex Input */}
      <div>
        <label className="text-xs text-muted-foreground">Hex</label>
        <input
          type="text"
          value={currentHex}
          onChange={(e) => handleHexChange(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-border rounded"
          placeholder="#ffffff"
        />
      </div>

      {/* RGB Sliders */}
      <div className="space-y-2">
        <div>
          <label className="text-xs text-muted-foreground flex justify-between">
            <span>Red</span>
            <span>{color.r}</span>
          </label>
          <input
            type="range"
            min="0"
            max="255"
            value={color.r}
            onChange={(e) => handleColorChange('r', parseInt(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-black to-red-500 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div>
          <label className="text-xs text-muted-foreground flex justify-between">
            <span>Green</span>
            <span>{color.g}</span>
          </label>
          <input
            type="range"
            min="0"
            max="255"
            value={color.g}
            onChange={(e) => handleColorChange('g', parseInt(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-black to-green-500 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div>
          <label className="text-xs text-muted-foreground flex justify-between">
            <span>Blue</span>
            <span>{color.b}</span>
          </label>
          <input
            type="range"
            min="0"
            max="255"
            value={color.b}
            onChange={(e) => handleColorChange('b', parseInt(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-black to-blue-500 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div>
          <label className="text-xs text-muted-foreground flex justify-between">
            <span>Opacity</span>
            <span>{Math.round((color.a || 1) * 100)}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={color.a || 1}
            onChange={(e) => handleColorChange('a', parseFloat(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-transparent to-black rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* RGB Values Display */}
      <div className="text-xs text-muted-foreground">
        rgba({color.r}, {color.g}, {color.b}, {(color.a || 1).toFixed(2)})
      </div>
    </div>
  );
}; 