```markdown
# Tauri Sports Scoreboard Designer - Development Plan (Tauri v2 + Latest Stack)

## Project Overview
A modern Tauri v2 desktop application that provides a design interface for creating custom sports scoreboards with complete flexibility in sizing and positioning. Users can create scoreboards of any dimensions and freely drag, drop, and resize all components. The scoreboard displays on a secondary monitor in real-time.

## Architecture

### Tech Stack
- **Backend**: Rust (Tauri v2.1+)
- **Frontend**: React 18+ with TypeScript 5+
- **Build Tool**: Vite 5+
- **Styling**: Tailwind CSS 3.4+
- **State Management**: Zustand 4.5+
- **UI Components**: Radix UI (latest) + shadcn/ui
- **Drag & Drop**: @dnd-kit/core 6.1+
- **Canvas Management**: Konva.js 9+ with react-konva 18.2+

## Core Features

### 1. Multi-Monitor Management (Tauri v2)
```rust
// src-tauri/src/lib.rs
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

#[tauri::command]
async fn get_available_monitors(app: tauri::AppHandle) -> Result<Vec<MonitorInfo>, String> {
    let monitors = app.available_monitors()
        .map_err(|e| e.to_string())?;
    
    let monitor_info: Vec<MonitorInfo> = monitors
        .into_iter()
        .enumerate()
        .map(|(id, monitor)| MonitorInfo {
            id: id as u32,
            name: monitor.name().unwrap_or_default(),
            width: monitor.size().width,
            height: monitor.size().height,
            x: monitor.position().x,
            y: monitor.position().y,
            is_primary: false,
            scale_factor: monitor.scale_factor(),
        })
        .collect();
    
    Ok(monitor_info)
}

#[tauri::command]
async fn create_scoreboard_window(
    app: tauri::AppHandle,
    monitor_id: u32,
    width: u32,
    height: u32,
    x: i32,
    y: i32,
) -> Result<(), String> {
    let window = WebviewWindowBuilder::new(
        &app,
        "scoreboard",
        WebviewUrl::App("scoreboard.html".into()),
    )
    .title("Scoreboard Display")
    .inner_size(width as f64, height as f64)
    .position(x as f64, y as f64)
    .resizable(true)
    .decorations(false)
    .always_on_top(true)
    .build()
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct MonitorInfo {
    pub id: u32,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    pub is_primary: bool,
    pub scale_factor: f64,
}
```

### 2. Tauri v2 Configuration
```json
// src-tauri/tauri.conf.json
{
  "$schema": "https://schema.tauri.app/config/2.0.0",
  "productName": "Scoreboard Designer",
  "version": "1.0.0",
  "identifier": "com.scoreboarddesigner.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173"
  },
  "app": {
    "security": {
      "csp": null
    },
    "windows": [
      {
        "label": "main",
        "title": "Scoreboard Designer",
        "width": 1400,
        "height": 900,
        "minWidth": 1200,
        "minHeight": 700,
        "resizable": true,
        "fullscreen": false
      }
    ]
  },
  "bundle": {
    "active": true,
    "category": "DeveloperTool",
    "copyright": "",
    "externalBin": [],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "identifier": "com.scoreboarddesigner.app",
    "longDescription": "",
    "macOS": {
      "entitlements": null,
      "exceptionDomain": "",
      "frameworks": [],
      "providerShortName": null,
      "signingIdentity": null
    },
    "resources": [],
    "shortDescription": "",
    "targets": "all",
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": ""
    }
  },
  "plugins": {
    "fs": {
      "all": true,
      "scope": ["$APPDATA/*", "$RESOURCE/*"]
    },
    "shell": {
      "all": false,
      "execute": true,
      "sidecar": true,
      "open": true
    }
  }
}
```

### 3. Modern Component System with Latest TypeScript
```typescript
// src/types/scoreboard.ts
export interface ScoreboardComponent {
  readonly id: string;
  type: ComponentType;
  position: Position;
  size: Size;
  rotation: number;
  style: ComponentStyle;
  data: ComponentData;
  readonly locked: boolean;
  readonly visible: boolean;
  zIndex: number;
  constraints?: ComponentConstraints;
}

export const enum ComponentType {
  SCORE = 'score',
  TIMER = 'timer',
  TEAM_NAME = 'team-name',
  TEXT = 'text',
  IMAGE = 'image',
  PERIOD = 'period',
  LOGO = 'logo',
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  CUSTOM_SHAPE = 'custom-shape',
}

export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
  readonly maintainAspectRatio?: boolean;
}

export interface ComponentConstraints {
  readonly minWidth?: number;
  readonly minHeight?: number;
  readonly maxWidth?: number;
  readonly maxHeight?: number;
  readonly lockAspectRatio?: boolean;
}

export interface ScoreboardConfig {
  readonly id: string;
  name: string;
  dimensions: {
    width: number;
    height: number;
  };
  background: {
    color: string;
    image?: string;
    opacity: number;
  };
  components: ScoreboardComponent[];
  gridSettings: {
    enabled: boolean;
    size: number;
    snapToGrid: boolean;
  };
  sport: SportType;
  version: string;
}
```

## Implementation Plan

### Phase 1: Project Setup with Latest Stack
1. **Initialize Tauri v2 project**
   ```bash
   # Install latest Tauri CLI
   cargo install tauri-cli --version "^2.0"
   
   # Create project with Tauri v2
   cargo tauri init --name scoreboard-designer --window-title "Scoreboard Designer"
   
   # Navigate to project
   cd scoreboard-designer
   
   # Install latest dependencies
   npm install react@^18.2.0 react-dom@^18.2.0
   npm install -D @types/react@^18.2.0 @types/react-dom@^18.2.0
   npm install -D typescript@^5.3.0 vite@^5.0.0
   npm install -D @vitejs/plugin-react@^4.2.0
   
   # Modern state and UI
   npm install zustand@^4.5.0
   npm install @radix-ui/react-dialog@^1.0.5
   npm install @radix-ui/react-slider@^1.1.2
   npm install @radix-ui/react-dropdown-menu@^2.0.6
   npm install @radix-ui/react-tooltip@^1.0.7
   
   # Latest drag and drop
   npm install @dnd-kit/core@^6.1.0
   npm install @dnd-kit/sortable@^8.0.0
   npm install @dnd-kit/utilities@^3.2.2
   
   # Canvas and graphics
   npm install konva@^9.2.0 react-konva@^18.2.10
   
   # Styling
   npm install tailwindcss@^3.4.0 autoprefixer@^10.4.16 postcss@^8.4.32
   npm install -D @tailwindcss/forms@^0.5.7
   npm install lucide-react@^0.300.0
   
   # Utility libraries
   npm install clsx@^2.0.0 class-variance-authority@^0.7.0
   npm install date-fns@^3.0.0
   npm install immer@^10.0.3
   ```

2. **Updated project structure for Tauri v2**
   ```
   src-tauri/
   ├── Cargo.toml
   ├── tauri.conf.json
   ├── build.rs
   ├── src/
   │   ├── lib.rs
   │   ├── commands/
   │   │   ├── mod.rs
   │   │   ├── monitor.rs
   │   │   ├── scoreboard.rs
   │   │   └── storage.rs
   │   ├── models/
   │   │   ├── mod.rs
   │   │   ├── scoreboard.rs
   │   │   └── component.rs
   │   └── utils/
   │       ├── mod.rs
   │       └── window.rs
   src/
   ├── main.tsx
   ├── App.tsx
   ├── components/
   │   ├── Designer/
   │   │   ├── Canvas/
   │   │   │   ├── DesignCanvas.tsx
   │   │   │   ├── ComponentRenderer.tsx
   │   │   │   ├── SelectionBox.tsx
   │   │   │   ├── ResizeHandles.tsx
   │   │   │   └── GridOverlay.tsx
   │   │   ├── Sidebar/
   │   │   │   ├── ComponentLibrary.tsx
   │   │   │   ├── LayerPanel.tsx
   │   │   │   └── PropertyPanel.tsx
   │   │   ├── Toolbar/
   │   │   │   ├── MainToolbar.tsx
   │   │   │   ├── ZoomControls.tsx
   │   │   │   ├── GridControls.tsx
   │   │   │   └── CanvasSizeControls.tsx
   │   │   └── DesignerApp.tsx
   │   ├── Scoreboard/
   │   │   ├── ScoreboardDisplay.tsx
   │   │   ├── ComponentTypes/
   │   │   └── LiveControls.tsx
   │   └── ui/
   │       ├── button.tsx
   │       ├── input.tsx
   │       ├── dialog.tsx
   │       ├── slider.tsx
   │       └── tooltip.tsx
   ├── stores/
   │   ├── useScoreboardStore.ts
   │   ├── useCanvasStore.ts
   │   └── useAppStore.ts
   ├── hooks/
   │   ├── useDragAndDrop.ts
   │   ├── useResize.ts
   │   ├── useTauriAPI.ts
   │   └── useKeyboardShortcuts.ts
   ├── types/
   │   ├── scoreboard.ts
   │   ├── canvas.ts
   │   └── tauri.ts
   ├── utils/
   │   ├── canvas.ts
   │   ├── geometry.ts
   │   ├── export.ts
   │   └── cn.ts
   └── lib/
       └── tauri.ts
   ```

3. **Tauri v2 Cargo.toml**
   ```toml
   [package]
   name = "scoreboard-designer"
   version = "1.0.0"
   description = "A modern scoreboard designer"
   authors = ["you"]
   edition = "2021"

   [build-dependencies]
   tauri-build = { version = "2.0", features = [] }

   [dependencies]
   tauri = { version = "2.0", features = ["macos-private-api"] }
   tauri-plugin-fs = "2.0"
   tauri-plugin-shell = "2.0"
   tauri-plugin-dialog = "2.0"
   tauri-plugin-window-state = "2.0"
   serde = { version = "1", features = ["derive"] }
   serde_json = "1"
   tokio = { version = "1", features = ["full"] }
   uuid = { version = "1.6", features = ["v4"] }
   ```

### Phase 2: Modern Canvas System with Latest @dnd-kit
```typescript
// src/stores/useCanvasStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

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
  resizeHandle: string | null;
  viewportBounds: DOMRect | null;
}

interface CanvasActions {
  setCanvasSize: (width: number, height: number) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  toggleSnapToGrid: () => void;
  selectComponent: (id: string, multiSelect?: boolean) => void;
  selectMultipleComponents: (ids: string[]) => void;
  clearSelection: () => void;
  startDrag: (offset: { x: number; y: number }) => void;
  endDrag: () => void;
  startResize: (handle: string) => void;
  endResize: () => void;
  setViewportBounds: (bounds: DOMRect) => void;
}

export const useCanvasStore = create<CanvasState & CanvasActions>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      canvasSize: { width: 1920, height: 1080 },
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
      viewportBounds: null,

      // Actions
      setCanvasSize: (width, height) => 
        set((state) => {
          state.canvasSize = { width, height };
        }),
      
      setZoom: (zoom) => 
        set((state) => {
          state.zoom = Math.max(0.1, Math.min(5, zoom));
        }),
      
      setPan: (x, y) => 
        set((state) => {
          state.pan = { x, y };
        }),
      
      toggleGrid: () => 
        set((state) => {
          state.grid.showGrid = !state.grid.showGrid;
        }),
      
      setGridSize: (size) => 
        set((state) => {
          state.grid.size = size;
        }),
      
      toggleSnapToGrid: () => 
        set((state) => {
          state.grid.snapToGrid = !state.grid.snapToGrid;
        }),
      
      selectComponent: (id, multiSelect = false) => 
        set((state) => {
          if (multiSelect) {
            if (state.selectedComponents.has(id)) {
              state.selectedComponents.delete(id);
            } else {
              state.selectedComponents.add(id);
            }
          } else {
            state.selectedComponents.clear();
            state.selectedComponents.add(id);
          }
        }),
      
      selectMultipleComponents: (ids) =>
        set((state) => {
          state.selectedComponents.clear();
          ids.forEach(id => state.selectedComponents.add(id));
        }),
      
      clearSelection: () => 
        set((state) => {
          state.selectedComponents.clear();
        }),
      
      startDrag: (offset) => 
        set((state) => {
          state.isDragging = true;
          state.dragOffset = offset;
        }),
      
      endDrag: () => 
        set((state) => {
          state.isDragging = false;
          state.dragOffset = { x: 0, y: 0 };
        }),
      
      startResize: (handle) => 
        set((state) => {
          state.isResizing = true;
          state.resizeHandle = handle;
        }),
      
      endResize: () => 
        set((state) => {
          state.isResizing = false;
          state.resizeHandle = null;
        }),
      
      setViewportBounds: (bounds) =>
        set((state) => {
          state.viewportBounds = bounds;
        }),
    }))
  )
);
```

### Phase 3: Modern React 18 Canvas with Concurrent Features
```typescript
// src/components/Designer/Canvas/DesignCanvas.tsx
import React, { 
  useRef, 
  useCallback, 
  useEffect, 
  startTransition,
  useDeferredValue 
} from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragStartEvent,
  DragMoveEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor
} from '@dnd-kit/core';
import { useCanvasStore } from '../../../stores/useCanvasStore';
import { useScoreboardStore } from '../../../stores/useScoreboardStore';
import { ComponentRenderer } from './ComponentRenderer';
import { SelectionBox } from './SelectionBox';
import { GridOverlay } from './GridOverlay';
import { cn } from '../../../utils/cn';

export const DesignCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    canvasSize,
    zoom,
    pan,
    grid,
    selectedComponents,
    isDragging,
    isResizing,
    setZoom,
    setPan,
    selectComponent,
    clearSelection,
    startDrag,
    endDrag,
    setViewportBounds,
  } = useCanvasStore();

  const {
    components,
    updateComponent,
    updateComponentPosition,
    updateComponentSize,
  } = useScoreboardStore();

  // Use deferred value for performance during heavy operations
  const deferredComponents = useDeferredValue(components);

  // Modern sensor setup for @dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Update viewport bounds on resize
  useEffect(() => {
    const updateBounds = () => {
      if (canvasRef.current) {
        const bounds = canvasRef.current.getBoundingClientRect();
        setViewportBounds(bounds);
      }
    };

    const resizeObserver = new ResizeObserver(updateBounds);
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [setViewportBounds]);

  // Handle component drag with React 18 concurrent features
  const handleComponentDrag = useCallback((
    componentId: string,
    deltaX: number,
    deltaY: number
  ) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    startTransition(() => {
      let newX = component.position.x + deltaX;
      let newY = component.position.y + deltaY;

      // Snap to grid if enabled
      if (grid.snapToGrid) {
        newX = Math.round(newX / grid.size) * grid.size;
        newY = Math.round(newY / grid.size) * grid.size;
      }

      // Boundary constraints
      newX = Math.max(0, Math.min(canvasSize.width - component.size.width, newX));
      newY = Math.max(0, Math.min(canvasSize.height - component.size.height, newY));

      updateComponentPosition(componentId, { x: newX, y: newY });
    });
  }, [components, grid, canvasSize, updateComponentPosition]);

  // Handle modern wheel events with better UX
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      // Zoom with center point preservation
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const centerX = (e.clientX - rect.left) / zoom - pan.x;
      const centerY = (e.clientY - rect.top) / zoom - pan.y;
      
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.1, Math.min(5, zoom + delta));
      
      const newPanX = (e.clientX - rect.left) / newZoom - centerX;
      const newPanY = (e.clientY - rect.top) / newZoom - centerY;
      
      setZoom(newZoom);
      setPan(newPanX, newPanY);
    } else {
      // Pan
      const deltaX = e.deltaX / zoom;
      const deltaY = e.deltaY / zoom;
      setPan(pan.x - deltaX, pan.y - deltaY);
    }
  }, [zoom, pan, setZoom, setPan]);

  // Modern drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    startDrag({ x: 0, y: 0 });
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { active, delta } = event;
    if (active.id) {
      handleComponentDrag(active.id as string, delta.x, delta.y);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    endDrag();
  };

  return (
    <div 
      ref={canvasRef}
      className={cn(
        "canvas-container relative overflow-hidden bg-gray-100 select-none",
        isDragging && "cursor-grabbing"
      )}
      onWheel={handleWheel}
    >
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <div
          className="canvas-viewport will-change-transform"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0',
            width: canvasSize.width,
            height: canvasSize.height,
            backgroundColor: 'white',
            position: 'relative',
          }}
        >
          {/* Grid overlay */}
          {grid.showGrid && <GridOverlay />}
          
          {/* Components with deferred rendering for performance */}
          {deferredComponents.map((component) => (
            <ComponentRenderer
              key={component.id}
              component={component}
              isSelected={selectedComponents.has(component.id)}
              onDrag={handleComponentDrag}
              onSelect={(id) => selectComponent(id, false)}
            />
          ))}
          
          {/* Selection box for multi-select */}
          <SelectionBox />
        </div>
      </DndContext>
      
      {/* Modern UI overlay */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
        <div className="text-sm font-medium">
          Canvas: {canvasSize.width} × {canvasSize.height}
        </div>
        <div className="text-sm text-gray-600">
          Zoom: {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
};
```

### Phase 4: Modern Tauri v2 API Integration
```typescript
// src/lib/tauri.ts
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { availableMonitors } from '@tauri-apps/api/window';

export interface MonitorInfo {
  id: number;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  is_primary: boolean;
  scale_factor: number;
}

export class TauriAPI {
  static async getMonitors(): Promise<MonitorInfo[]> {
    try {
      return await invoke('get_available_monitors');
    } catch (error) {
      console.error('Failed to get monitors:', error);
      return [];
    }
  }

  static async createScoreboardWindow(
    monitorId: number,
    width: number,
    height: number,
    x: number,
    y: number
  ): Promise<void> {
    try {
      await invoke('create_scoreboard_window', {
        monitorId,
        width,
        height,
        x,
        y,
      });
    } catch (error) {
      console.error('Failed to create scoreboard window:', error);
      throw error;
    }
  }

  static async saveScoreboard(name: string, config: any): Promise<void> {
    try {
      await invoke('save_scoreboard', { name, config });
    } catch (error) {
      console.error('Failed to save scoreboard:', error);
      throw error;
    }
  }

  static async loadScoreboard(name: string): Promise<any> {
    try {
      return await invoke('load_scoreboard', { name });
    } catch (error) {
      console.error('Failed to load scoreboard:', error);
      throw error;
    }
  }

  static async getCurrentWindow() {
    return getCurrentWebviewWindow();
  }
}
```

### Phase 5: Modern UI Components with shadcn/ui
```typescript
// src/components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

## Advanced Features (Latest Technologies)

### Performance Optimizations
- React 18 Concurrent Features (startTransition, useDeferredValue)
- Virtual scrolling for large component lists
- Canvas rendering optimizations with OffscreenCanvas
- Web Workers for heavy computations

### Modern UX Features
- Gesture support with modern pointer events
- Haptic feedback (where supported)
- Accessibility improvements with latest ARIA patterns
- Dark mode with CSS custom properties

### Export and Integration
- Modern file system APIs
- WebAssembly for image processing
- Modern clipboard API for copy/paste
- Drag and drop from file system

## Development Timeline

- **Week 1-2**: Project setup with Tauri v2, modern React 18 setup, basic canvas
- **Week 3-4**: Advanced drag-and-drop with @dnd-kit v6, resize system
- **Week 5-6**: Multi-monitor support with Tauri v2 APIs, scoreboard display
- **Week 7-8**: Modern UI with shadcn/ui, property panels, templates
- **Week 9-10**: Performance optimization, testing, documentation

## Getting Started

1. **Install latest prerequisites:**
   ```bash
   # Install Rust
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   
   # Install Node.js 20+
   # Use nvm or download from nodejs.org
   
   # Install pnpm (fastest package manager)
   corepack enable
   ```

2. **Create project with Tauri v2:**
   ```bash
   # Install Tauri CLI v2
   cargo install tauri-cli --version "^2.0"
   
   # Create project
   cargo tauri init
   ```

3. **Install modern dependencies:**
   ```bash
   pnpm create vite . --template react-ts
   pnpm add @tauri-apps/api@^2.0.0
   pnpm add react@^18.2.0 react-dom@^18.2.0
   pnpm add zustand@^4.5.0 @dnd-kit/core@^6.1.0
   pnpm add @radix-ui/react-dialog@^1.0.5
   pnpm add tailwindcss@^3.4.0 lucide-react@^0.300.0
   pnpm add konva@^9.2.0 react-konva@^18.2.10
   ```

4. **Run development server:**
   ```bash
   pnpm tauri dev
   ```

This plan provides a cutting-edge solution using the latest versions of all technologies, with Tauri v2's improved performance and React 18's concurrent features for the best possible user experience.
```