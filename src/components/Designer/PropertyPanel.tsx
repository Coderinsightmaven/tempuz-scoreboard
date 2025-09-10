import React, { useState } from 'react';
import { useScoreboardStore } from '../../stores/useScoreboardStore';
import { useCanvasStore } from '../../stores/useCanvasStore';
import { useImageStore } from '../../stores/useImageStore';
import { useVideoStore } from '../../stores/useVideoStore';
import { useLiveDataStore } from '../../stores/useLiveDataStore';
import { ComponentType, ScoreboardComponent } from '../../types/scoreboard';
import { ImageManager } from '../ui/ImageManager';
import { VideoManager } from '../ui/VideoManager';

export const PropertyPanel: React.FC = () => {
  const { components, updateComponentData, updateComponentStyle, removeComponent } = useScoreboardStore();
  const { selectedComponents, selectComponent, clearSelection } = useCanvasStore();
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [isVideoManagerOpen, setIsVideoManagerOpen] = useState(false);

  // Get the selected component (only show properties if exactly one is selected)
  const selectedComponent = selectedComponents.size === 1 
    ? components.find(c => c.id === Array.from(selectedComponents)[0])
    : null;

  if (!selectedComponent) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <ComponentsList />
      </div>
    );
  }

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    const { updateComponentPosition } = useScoreboardStore.getState();
    updateComponentPosition(selectedComponent.id, {
      ...selectedComponent.position,
      [axis]: value
    });
  };

  const handleSizeChange = (dimension: 'width' | 'height', value: number) => {
    const { updateComponentSize } = useScoreboardStore.getState();
    updateComponentSize(selectedComponent.id, {
      ...selectedComponent.size,
      [dimension]: Math.max(10, value) // Minimum size of 10px
    });
  };

  const handleStyleChange = (property: string, value: any) => {
    updateComponentStyle(selectedComponent.id, { [property]: value });
  };

  const handleDataChange = (property: string, value: any) => {
    updateComponentData(selectedComponent.id, { [property]: value });
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
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    handlePositionChange('x', Math.round(selectedComponent.position.x) + 1);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    handlePositionChange('x', Math.round(selectedComponent.position.x) - 1);
                  }
                }}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Y</label>
              <input
                type="number"
                value={Math.round(selectedComponent.position.y)}
                onChange={(e) => handlePositionChange('y', parseInt(e.target.value) || 0)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    handlePositionChange('y', Math.round(selectedComponent.position.y) + 1);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    handlePositionChange('y', Math.round(selectedComponent.position.y) - 1);
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
                value={Math.round(selectedComponent.size.width)}
                onChange={(e) => handleSizeChange('width', parseInt(e.target.value) || 0)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    handleSizeChange('width', Math.round(selectedComponent.size.width) + 1);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    handleSizeChange('width', Math.max(10, Math.round(selectedComponent.size.width) - 1));
                  }
                }}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
              <input
                type="number"
                value={Math.round(selectedComponent.size.height)}
                onChange={(e) => handleSizeChange('height', parseInt(e.target.value) || 0)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    handleSizeChange('height', Math.round(selectedComponent.size.height) + 1);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    handleSizeChange('height', Math.max(10, Math.round(selectedComponent.size.height) - 1));
                  }
                }}
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
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={selectedComponent.style.borderColor === 'transparent' ? '#000000' : (selectedComponent.style.borderColor || '#000000')}
                onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                className="w-16 h-8 rounded border border-gray-300"
                disabled={selectedComponent.style.borderColor === 'transparent'}
              />
              <button
                onClick={() => handleStyleChange('borderColor', selectedComponent.style.borderColor === 'transparent' ? '#000000' : 'transparent')}
                className={`px-3 py-1 text-xs rounded border ${
                  selectedComponent.style.borderColor === 'transparent' 
                    ? 'bg-blue-100 text-blue-800 border-blue-300' 
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
              >
                {selectedComponent.style.borderColor === 'transparent' ? 'Visible' : 'Transparent'}
              </button>
            </div>
            {selectedComponent.style.borderColor === 'transparent' && (
              <div className="text-xs text-gray-500 mt-1">Border is transparent</div>
            )}
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

      {isVideoManagerOpen && (
        <VideoManager
          isOpen={isVideoManagerOpen}
          onClose={() => setIsVideoManagerOpen(false)}
          selectMode={true}
          onSelectVideo={(video) => {
            updateComponentData(selectedComponent.id, { videoId: video.id });
            setIsVideoManagerOpen(false);
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
      case ComponentType.VIDEO:
        return <VideoComponentProperties />;
      case ComponentType.TENNIS_PLAYER_NAME:
        return <TennisPlayerNameProperties />;
      case ComponentType.TENNIS_DOUBLES_PLAYER_NAME:
        return <TennisDoublesPlayerNameProperties />;
      case ComponentType.TENNIS_GAME_SCORE:
        return <TennisGameScoreProperties />;
      case ComponentType.TENNIS_SET_SCORE:
        return <TennisSetScoreProperties />;
      case ComponentType.TENNIS_MATCH_SCORE:
        return <TennisMatchScoreProperties />;
      case ComponentType.TENNIS_DETAILED_SET_SCORE:
        return <TennisDetailedSetScoreProperties />;
      case ComponentType.TENNIS_SERVING_INDICATOR:
        return <TennisServingIndicatorProperties />;
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

  function VideoComponentProperties() {
    const { videos } = useVideoStore();
    const selectedVideo = videos.find(video => video.id === selectedComponent?.data.videoId);

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video File
          </label>
          {selectedVideo ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                  🎥
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{selectedVideo.originalName}</div>
                  <div className="text-xs text-gray-500">Video File</div>
                </div>
              </div>
              <button
                onClick={() => setIsVideoManagerOpen(true)}
                className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Change Video
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsVideoManagerOpen(true)}
              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Select Video
            </button>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scale Mode
          </label>
          <select
            value={selectedComponent?.data.videoData?.scaleMode || 'cover'}
            onChange={(e) => handleDataChange('videoData', { 
              ...selectedComponent?.data.videoData, 
              scaleMode: e.target.value 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="cover">Cover (Fill entire area)</option>
            <option value="contain">Contain (Fit within area)</option>
            <option value="stretch">Stretch (Fill ignoring aspect ratio)</option>
            <option value="original">Original Size</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Playback Settings
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedComponent?.data.videoData?.autoplay || false}
                onChange={(e) => handleDataChange('videoData', { 
                  ...selectedComponent?.data.videoData, 
                  autoplay: e.target.checked 
                })}
                className="mr-2"
              />
              <span className="text-sm">Autoplay</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedComponent?.data.videoData?.loop || false}
                onChange={(e) => handleDataChange('videoData', { 
                  ...selectedComponent?.data.videoData, 
                  loop: e.target.checked 
                })}
                className="mr-2"
              />
              <span className="text-sm">Loop</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedComponent?.data.videoData?.muted !== false}
                onChange={(e) => handleDataChange('videoData', { 
                  ...selectedComponent?.data.videoData, 
                  muted: e.target.checked 
                })}
                className="mr-2"
              />
              <span className="text-sm">Muted</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedComponent?.data.videoData?.controls || false}
                onChange={(e) => handleDataChange('videoData', { 
                  ...selectedComponent?.data.videoData, 
                  controls: e.target.checked 
                })}
                className="mr-2"
              />
              <span className="text-sm">Show Controls</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Volume: {Math.round((selectedComponent?.data.videoData?.volume || 1) * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={selectedComponent?.data.videoData?.volume || 1}
            onChange={(e) => handleDataChange('videoData', { 
              ...selectedComponent?.data.videoData, 
              volume: parseFloat(e.target.value) 
            })}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Playback Speed: {selectedComponent?.data.videoData?.playbackRate || 1}x
          </label>
          <select
            value={selectedComponent?.data.videoData?.playbackRate || 1}
            onChange={(e) => handleDataChange('videoData', { 
              ...selectedComponent?.data.videoData, 
              playbackRate: parseFloat(e.target.value) 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1x (Normal)</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        </div>
      </div>
    );
  }

  function TennisPlayerNameProperties() {
    const [localText, setLocalText] = useState(selectedComponent?.data.text || '');

    React.useEffect(() => {
      setLocalText(selectedComponent?.data.text || '');
    }, [selectedComponent?.id, selectedComponent?.data.text]);

    const handleTextBlur = () => {
      if (localText !== selectedComponent?.data.text) {
        handleDataChange('text', localText);
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Player Number
          </label>
          <select
            value={selectedComponent?.data.playerNumber || 1}
            onChange={(e) => handleDataChange('playerNumber', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Player 1</option>
            <option value={2}>Player 2</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fallback Text
          </label>
          <input
            type="text"
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            onBlur={handleTextBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Player Name"
          />
          <div className="text-xs text-gray-500 mt-1">
            Shown when no live data is available
          </div>
        </div>

        <TennisApiBindingSection />
        <TextStyleSection />
      </div>
    );
  }

  function TennisDoublesPlayerNameProperties() {
    const [localText, setLocalText] = useState(selectedComponent?.data.text || '');

    React.useEffect(() => {
      setLocalText(selectedComponent?.data.text || '');
    }, [selectedComponent?.id, selectedComponent?.data.text]);

    const handleTextBlur = () => {
      if (localText !== selectedComponent?.data.text) {
        handleDataChange('text', localText);
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Doubles Player
          </label>
          <select
            value={selectedComponent?.data.playerNumber || 1}
            onChange={(e) => handleDataChange('playerNumber', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Team 1 (Lastname / Lastname)</option>
            <option value={2}>Team 1 (Lastname / Lastname)</option>
            <option value={3}>Team 2 (Lastname / Lastname)</option>
            <option value={4}>Team 2 (Lastname / Lastname)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fallback Name
          </label>
          <input
            type="text"
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            onBlur={handleTextBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Lastname / Lastname"
          />
          <div className="text-xs text-gray-500 mt-1">
            Enter team names as "Lastname1 / Lastname2" format
          </div>
        </div>

        <TennisApiBindingSection />
        <TextStyleSection />
      </div>
    );
  }

  function TennisGameScoreProperties() {
    const [localText, setLocalText] = useState(selectedComponent?.data.text || '');

    React.useEffect(() => {
      setLocalText(selectedComponent?.data.text || '');
    }, [selectedComponent?.id, selectedComponent?.data.text]);

    const handleTextBlur = () => {
      if (localText !== selectedComponent?.data.text) {
        handleDataChange('text', localText);
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Player Number
          </label>
          <select
            value={selectedComponent?.data.playerNumber || 1}
            onChange={(e) => handleDataChange('playerNumber', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Player 1</option>
            <option value={2}>Player 2</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fallback Score
          </label>
          <input
            type="text"
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            onBlur={handleTextBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
          <div className="text-xs text-gray-500 mt-1">
            Shown when no live data is available
          </div>
        </div>

        <TennisApiBindingSection />
        <TextStyleSection />
      </div>
    );
  }

  function TennisSetScoreProperties() {
    const [localText, setLocalText] = useState(selectedComponent?.data.text || '');

    React.useEffect(() => {
      setLocalText(selectedComponent?.data.text || '');
    }, [selectedComponent?.id, selectedComponent?.data.text]);

    const handleTextBlur = () => {
      if (localText !== selectedComponent?.data.text) {
        handleDataChange('text', localText);
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Player Number
          </label>
          <select
            value={selectedComponent?.data.playerNumber || 1}
            onChange={(e) => handleDataChange('playerNumber', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Player 1</option>
            <option value={2}>Player 2</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fallback Score
          </label>
          <input
            type="text"
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            onBlur={handleTextBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
          <div className="text-xs text-gray-500 mt-1">
            Shown when no live data is available
          </div>
        </div>

        <TennisApiBindingSection />
        <TextStyleSection />
      </div>
    );
  }

  function TennisMatchScoreProperties() {
    const [localText, setLocalText] = useState(selectedComponent?.data.text || '');

    React.useEffect(() => {
      setLocalText(selectedComponent?.data.text || '');
    }, [selectedComponent?.id, selectedComponent?.data.text]);

    const handleTextBlur = () => {
      if (localText !== selectedComponent?.data.text) {
        handleDataChange('text', localText);
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Player Number
          </label>
          <select
            value={selectedComponent?.data.playerNumber || 1}
            onChange={(e) => handleDataChange('playerNumber', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Player 1</option>
            <option value={2}>Player 2</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fallback Score
          </label>
          <input
            type="text"
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            onBlur={handleTextBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
          <div className="text-xs text-gray-500 mt-1">
            Shown when no live data is available
          </div>
        </div>

        <TennisApiBindingSection />
        <TextStyleSection />
      </div>
    );
  }


  function TennisDetailedSetScoreProperties() {
    const [localText, setLocalText] = useState(selectedComponent?.data.text || '');

    React.useEffect(() => {
      setLocalText(selectedComponent?.data.text || '');
    }, [selectedComponent?.id, selectedComponent?.data.text]);

    const handleTextBlur = () => {
      if (localText !== selectedComponent?.data.text) {
        handleDataChange('text', localText);
      }
    };

    // Determine available sets based on live data
    const getAvailableSets = () => {
      // Since we're focused on tennis API, show all sets
      return [1, 2, 3];
    };

    const availableSets = getAvailableSets();
    const currentSetNumber = selectedComponent?.data.setNumber || 1;

    // If current selected set is not available anymore, reset to the highest available
    React.useEffect(() => {
      if (!availableSets.includes(currentSetNumber)) {
        const maxAvailableSet = Math.max(...availableSets);
        handleDataChange('setNumber', maxAvailableSet);
      }
    }, [availableSets, currentSetNumber]);

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Set Number
          </label>
          <select
            value={selectedComponent?.data.setNumber || 1}
            onChange={(e) => handleDataChange('setNumber', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableSets.map(setNum => (
              <option key={setNum} value={setNum}>
                Set {setNum}
              </option>
            ))}
          </select>
          <div className="text-xs text-gray-500 mt-1">
            {availableSets.length < 3 ? 
              `Only shows sets that are in progress or completed (${availableSets.length} of 3 available)` :
              'All sets available (no live data connection)'
            }
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Player Number
          </label>
          <select
            value={selectedComponent?.data.playerNumber || 1}
            onChange={(e) => handleDataChange('playerNumber', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Player 1</option>
            <option value={2}>Player 2</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fallback Score
          </label>
          <input
            type="text"
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            onBlur={handleTextBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
          <div className="text-xs text-gray-500 mt-1">
            Shown when no live data is available
          </div>
        </div>

        <TennisApiBindingSection />
        <TextStyleSection />
      </div>
    );
  }

  function TennisServingIndicatorProperties() {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Player to Track
          </label>
          <select
            value={selectedComponent?.data.playerNumber || 1}
            onChange={(e) => handleDataChange('playerNumber', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Player 1</option>
            <option value={2}>Player 2</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            The tennis ball emoji will appear when this player is serving
          </div>
        </div>

        <TennisApiBindingSection />
        <TextStyleSection />
      </div>
    );
  }

  function TennisApiBindingSection() {
    const { tennisApiConnected, getTennisApiScoreboards } = useLiveDataStore();

    if (!tennisApiConnected) {
      return (
        <div className="border-t border-gray-200 pt-4">
          <h5 className="text-sm font-medium text-gray-900 mb-2">Tennis API</h5>
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            🔌 Connect to tennis-api WebSocket to enable live data
          </div>
        </div>
      );
    }

    const scoreboards = getTennisApiScoreboards();

    return (
      <div className="border-t border-gray-200 pt-4">
        <h5 className="text-sm font-medium text-gray-900 mb-2">Tennis API</h5>

        <div className="space-y-3">

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Available Scoreboards ({scoreboards.length})
            </label>
            <div className="text-xs text-gray-600">
              {scoreboards.length === 0 ? (
                'No scoreboards loaded'
              ) : (
                scoreboards.map((sb: { id: string; name: string }) => `${sb.name} (${sb.id})`).join(', ')
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  function TextStyleSection() {
    return (
      <div className="border-t border-gray-200 pt-4">
        <h5 className="text-sm font-medium text-gray-900 mb-2">Text Style</h5>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
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
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Text Color
            </label>
            <input
              type="color"
              value={selectedComponent?.style.textColor || '#ffffff'}
              onChange={(e) => handleStyleChange('textColor', e.target.value)}
              className="w-full h-8 rounded border border-gray-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Text Align
            </label>
            <select
              value={selectedComponent?.style.textAlign || 'center'}
              onChange={(e) => handleStyleChange('textAlign', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Font Weight
            </label>
            <select
              value={selectedComponent?.style.fontWeight || 'normal'}
              onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
              <option value="lighter">Light</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  function ComponentsList() {
    const sortedComponents = [...components].sort((a, b) => {
      // Sort by zIndex (background components first)
      const zIndexDiff = (a.zIndex || 0) - (b.zIndex || 0);
      if (zIndexDiff !== 0) return zIndexDiff;
      
      // Then by creation order (id)
      return a.id.localeCompare(b.id);
    });

    const getComponentTypeName = (type: ComponentType) => {
      switch (type) {
        case ComponentType.BACKGROUND:
          return 'Background';
        case ComponentType.LOGO:
          return 'Logo';
        case ComponentType.TEXT:
          return 'Text';
        case ComponentType.TENNIS_PLAYER_NAME:
          return 'Tennis Player Name';
        case ComponentType.TENNIS_DOUBLES_PLAYER_NAME:
          return 'Tennis Doubles Player Name';
        case ComponentType.TENNIS_GAME_SCORE:
          return 'Tennis Game Score';
        case ComponentType.TENNIS_SET_SCORE:
          return 'Tennis Set Score';
        case ComponentType.TENNIS_MATCH_SCORE:
          return 'Tennis Match Score';
        case ComponentType.TENNIS_DETAILED_SET_SCORE:
          return 'Tennis Detailed Set Score';
        case ComponentType.TENNIS_SERVING_INDICATOR:
          return 'Tennis Serving Indicator';
        default:
          return 'Unknown';
      }
    };

    const getComponentIcon = (type: ComponentType) => {
      switch (type) {
        case ComponentType.BACKGROUND:
          return '🖼️';
        case ComponentType.LOGO:
          return '🏷️';
        case ComponentType.TEXT:
          return '📝';
        case ComponentType.TENNIS_PLAYER_NAME:
          return '👤';
        case ComponentType.TENNIS_DOUBLES_PLAYER_NAME:
          return '👥';
        case ComponentType.TENNIS_GAME_SCORE:
        case ComponentType.TENNIS_SET_SCORE:
        case ComponentType.TENNIS_MATCH_SCORE:
        case ComponentType.TENNIS_DETAILED_SET_SCORE:
        case ComponentType.TENNIS_SERVING_INDICATOR:
          return '🎾';
        default:
          return '❓';
      }
    };

    const getComponentDisplayText = (component: ScoreboardComponent) => {
      if (component.data.text) {
        return component.data.text.length > 20 
          ? component.data.text.substring(0, 20) + '...'
          : component.data.text;
      }
      
      switch (component.type) {
        case ComponentType.TENNIS_PLAYER_NAME:
          return `Player ${component.data.playerNumber || 1}`;
        case ComponentType.TENNIS_DOUBLES_PLAYER_NAME:
          const playerNum = component.data.playerNumber || 1;
          if (playerNum === 1 || playerNum === 2) return 'Smith / Johnson';
          if (playerNum === 3 || playerNum === 4) return 'Williams / Brown';
          return 'Smith / Johnson';
        case ComponentType.TENNIS_GAME_SCORE:
        case ComponentType.TENNIS_SET_SCORE:
        case ComponentType.TENNIS_MATCH_SCORE:
          return `Player ${component.data.playerNumber || 1} Score`;
        case ComponentType.TENNIS_DETAILED_SET_SCORE:
          return 'Sets Score (e.g., 6-4, 5-7, 7-5)';
        case ComponentType.TENNIS_SERVING_INDICATOR:
          return `Player ${component.data.playerNumber || 1} Serving`;
        default:
          return 'No text';
      }
    };

    const handleComponentSelect = (componentId: string) => {
      selectComponent(componentId);
    };

    const handleComponentDelete = (componentId: string, event: React.MouseEvent) => {
      event.stopPropagation();
      if (confirm('Are you sure you want to delete this component?')) {
        removeComponent(componentId);
      }
    };

    const handleComponentToggleVisibility = (componentId: string, event: React.MouseEvent) => {
      event.stopPropagation();
      const component = components.find(c => c.id === componentId);
      if (component) {
        updateComponentData(componentId, { visible: !component.visible });
      }
    };

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="border-b border-gray-200 pb-3">
          <h3 className="text-lg font-medium text-gray-900">
            Components ({components.length})
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Click a component to edit its properties
          </p>
        </div>

        {/* Components List */}
        {components.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No components added yet</p>
            <p className="text-gray-400 text-xs mt-1">Add components from the left sidebar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedComponents.map((component, index) => (
              <div
                key={component.id}
                className="group bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg p-3 cursor-pointer transition-colors"
                onClick={() => handleComponentSelect(component.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    {/* Component Icon */}
                    <div className="text-lg flex-shrink-0">
                      {getComponentIcon(component.type)}
                    </div>
                    
                    {/* Component Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {getComponentTypeName(component.type)}
                        </h4>
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                          {index + 1}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {getComponentDisplayText(component)}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                        <span>
                          📍 {Math.round(component.position.x)}, {Math.round(component.position.y)}
                        </span>
                        <span>
                          📏 {Math.round(component.size.width)}×{Math.round(component.size.height)}
                        </span>
                        <span>
                          🔢 z: {component.zIndex || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleComponentToggleVisibility(component.id, e)}
                      className={`p-1 rounded hover:bg-gray-200 ${!component.visible ? 'text-gray-400' : 'text-gray-600'}`}
                      title={component.visible ? 'Hide component' : 'Show component'}
                    >
                      {component.visible ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m6.121-6.121a3 3 0 11-4.243 4.243m4.243-4.243L21 21" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={(e) => handleComponentDelete(component.id, e)}
                      className="p-1 rounded hover:bg-red-100 text-red-600"
                      title="Delete component"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                
                {/* Hidden Component Indicator */}
                {!component.visible && (
                  <div className="mt-2 text-xs text-gray-500 italic">
                    🚫 Hidden
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bulk Actions */}
        {components.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="text-xs text-gray-500 mb-2">Bulk Actions</div>
            <div className="flex space-x-2">
              <button
                onClick={clearSelection}
                className="flex-1 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Clear Selection
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete all ${components.length} components?`)) {
                    components.forEach(c => removeComponent(c.id));
                  }
                }}
                className="flex-1 px-3 py-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
              >
                Delete All
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
};