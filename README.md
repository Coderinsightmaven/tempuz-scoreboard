# Tempuz Scoreboard

A modern, professional desktop application for designing and displaying custom tennis scoreboards with live data integration. Built with Tauri v2, React, and Rust for maximum performance and flexibility.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tauri](https://img.shields.io/badge/Tauri-v2.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

## 🎾 Overview

Tempuz Scoreboard is a powerful desktop application that enables users to create custom tennis scoreboard designs with a drag-and-drop interface and display them on multiple monitors with live match data integration. Perfect for tennis tournaments, clubs, and broadcast operations.

## ✨ Key Features

### 🎨 Visual Scoreboard Designer
- **Drag-and-Drop Interface**: Intuitive canvas-based design system
- **Custom Components**: Add text, images, videos, logos, and live data fields
- **Flexible Layouts**: Any scoreboard dimension with precise positioning
- **Grid Snapping**: Alignment guides and grid system for pixel-perfect designs
- **Property Panel**: Fine-tune colors, fonts, sizes, and positions
- **Copy/Paste**: Duplicate components quickly with keyboard shortcuts (Ctrl+C/Ctrl+V)

### 📺 Multi-Monitor Display
- **Multiple Outputs**: Display scoreboards on any connected monitor
- **Borderless Windows**: Full-screen, always-on-top display windows
- **Synchronized Updates**: Real-time synchronization across all displays
- **Multiple Scoreboards**: Manage and display multiple scoreboard instances simultaneously

### 🔴 Live Data Integration
- **WebSocket Support**: Real-time tennis data via WebSocket connections
- **REST API Integration**: Poll data from HTTP endpoints
- **IonCourt Compatible**: Built-in support for IonCourt tennis data API
- **Custom Data Sources**: Flexible integration with any tennis scoring system
- **Rust Tennis Processor**: High-performance data processing in Rust backend

### 🎾 Tennis-Specific Components
- **Player Names**: Singles and doubles player name displays
- **Team Names**: Dynamic team name displays
- **Adaptive Team Display**: Smart formatting for singles vs doubles matches
- **Live Scores**: Game points (0, 15, 30, 40, Deuce, AD)
- **Set Scores**: Current and historical set scores (up to 5 sets)
- **Match Scores**: Total sets won
- **Serving Indicators**: Visual indicators for serving player
- **Individual Set Components**: Granular control over each set score

### 💾 Asset Management
- **Image Manager**: Upload, organize, and use images in designs
- **Video Support**: Add video components to scoreboards
- **Export/Import**: Package entire scoreboards with assets as ZIP files
- **Cloud Storage**: Persistent storage via Tauri filesystem API

### 🎯 Professional Features
- **Save/Load Designs**: Save multiple scoreboard designs
- **Design Templates**: Create and reuse scoreboard layouts
- **Zoom & Pan**: Navigate large scoreboards easily
- **Fit to Screen**: Auto-scale designs to viewport
- **Responsive Canvas**: Adapt to different window sizes
- **Keyboard Shortcuts**: Speed up workflow with hotkeys

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (with yarn)
- **Rust** 1.70+ ([Install Rust](https://rustup.rs/))
- **Tauri CLI** v2.0+

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/tempuz-scoreboard.git
   cd tempuz-scoreboard
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

3. **Run in development mode:**
   ```bash
   yarn tauri dev
   ```

### Building for Production

```bash
# Build the application
yarn tauri build

# The installer will be in src-tauri/target/release/bundle/
```

## 📖 Usage Guide

### Creating Your First Scoreboard

1. **Launch the Application**
   - Start Tempuz Scoreboard
   - Click "New Scoreboard" in the header

2. **Configure Dimensions**
   - Enter scoreboard name (e.g., "Center Court Display")
   - Set width and height (e.g., 1920x1080 for Full HD)
   - Click "Create"

3. **Add Components**
   - Browse component library in the left sidebar
   - Click a component type to add it to the canvas
   - Drag components to position them
   - Resize using corner handles

4. **Configure Properties**
   - Select a component on the canvas
   - Use the Property Panel (right side) to customize:
     - Text content and font
     - Colors and background
     - Size and position
     - Live data bindings

5. **Connect Live Data**
   - Click "Tennis API Connection" button in header
   - Enter WebSocket URL or API endpoint
   - Test the connection
   - Components with data bindings will update automatically

6. **Save Your Design**
   - Click "Save Design" in the header
   - Enter a name for your scoreboard
   - Design is saved to local storage

7. **Display on Monitor**
   - Click "Multiple Scoreboards" button
   - Select your saved scoreboard
   - Choose target monitor
   - Click "Show Scoreboard"

### Live Data Integration

#### IonCourt WebSocket Connection

```
WebSocket URL: wss://sub.ioncourt.com/?token=YOUR_TOKEN
```

The application auto-connects to IonCourt on startup if configured. See [TENNIS_DATA_INTEGRATION.md](TENNIS_DATA_INTEGRATION.md) for detailed integration guides.

#### Custom Data Sources

Connect to any tennis scoring system by implementing the expected JSON format. Supports:
- REST APIs (with polling)
- WebSocket streams
- Firebase Realtime Database
- File-based integration
- Custom middleware services

See [TENNIS_DATA_INTEGRATION.md](TENNIS_DATA_INTEGRATION.md) for complete integration documentation.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+C` / `Cmd+C` | Copy selected components |
| `Ctrl+V` / `Cmd+V` | Paste components |
| Mouse Wheel | Pan canvas |
| `Ctrl` + Mouse Wheel | Zoom in/out |

## 🏗️ Project Structure

```
tempuz-scoreboard/
├── src/                          # React frontend source
│   ├── components/               # React components
│   │   ├── Designer/            # Scoreboard designer components
│   │   │   ├── Canvas/          # Canvas rendering and interaction
│   │   │   └── PropertyPanel.tsx # Component property editor
│   │   └── ui/                  # UI components and dialogs
│   ├── stores/                  # Zustand state management
│   │   ├── useAppStore.ts       # Global app state
│   │   ├── useCanvasStore.ts    # Canvas state (zoom, pan, selection)
│   │   ├── useScoreboardStore.ts # Scoreboard design state
│   │   ├── useLiveDataStore.ts  # Live data connections
│   │   ├── useImageStore.ts     # Image asset management
│   │   └── useVideoStore.ts     # Video asset management
│   ├── services/                # Business logic services
│   │   ├── courtDataSync.ts     # Court data synchronization
│   │   └── rustTennisProcessor.ts # Rust backend interface
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Utility functions
│   ├── workers/                 # Web Workers for performance
│   └── hooks/                   # Custom React hooks
├── src-tauri/                   # Rust backend
│   ├── src/
│   │   ├── commands/            # Tauri command handlers
│   │   │   ├── court_data_sync.rs  # Tennis data processing
│   │   │   ├── images.rs           # Image management
│   │   │   ├── videos.rs           # Video management
│   │   │   ├── live_data.rs        # Live data connections
│   │   │   ├── monitor.rs          # Multi-monitor support
│   │   │   ├── scoreboard.rs       # Scoreboard operations
│   │   │   └── storage.rs          # File system operations
│   │   ├── state.rs             # Application state management
│   │   ├── storage.rs           # Persistent storage
│   │   └── lib.rs               # Main library entry
│   ├── Cargo.toml              # Rust dependencies
│   └── tauri.conf.json         # Tauri configuration
├── public/                      # Static assets
│   ├── scoreboard.html          # Single scoreboard display
│   └── composite-scoreboard.html # Multiple scoreboard display
├── package.json                 # Node dependencies
├── tailwind.config.js          # Tailwind CSS configuration
├── vite.config.ts              # Vite build configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

## 🔧 Technical Architecture

### Frontend Stack
- **React 18**: UI framework with concurrent features
- **TypeScript 5**: Type-safe development
- **Vite 4**: Fast build tool and dev server
- **Tailwind CSS 3**: Utility-first styling
- **Zustand 4**: Lightweight state management
- **@dnd-kit**: Modern drag-and-drop library
- **Lucide React**: Icon library
- **Socket.io Client**: WebSocket connections

### Backend Stack
- **Tauri v2**: Cross-platform desktop framework
- **Rust**: High-performance backend language
- **Tauri Plugins**:
  - `tauri-plugin-fs`: File system access
  - `tauri-plugin-dialog`: Native dialogs
  - `tauri-plugin-shell`: Process management
  - `tauri-plugin-opener`: URL/file opening

### Key Design Patterns
- **Store-based State Management**: Zustand stores for different domains
- **Command Pattern**: Rust commands for backend operations
- **Observer Pattern**: WebSocket event handling
- **Component Pattern**: Reusable UI and canvas components
- **Worker Pattern**: Web Workers for heavy computations

## 🎯 Component Types

### Static Components
- **BACKGROUND**: Full-canvas background images
- **LOGO**: Resizable logo images
- **TEXT**: Custom text overlays
- **VIDEO**: Video player components

### Live Data Components
- **TENNIS_PLAYER_NAME**: Player name (singles)
- **TENNIS_DOUBLES_PLAYER_NAME**: Doubles team names (Lastname / Lastname)
- **TENNIS_TEAM_NAMES**: Team names from API (e.g., "Georgia vs Cal")
- **TENNIS_ADAPTIVE_TEAM_DISPLAY**: Smart display (school names for doubles, school-lastname for singles)
- **TENNIS_GAME_SCORE**: Current game points
- **TENNIS_SET_SCORE**: Current set games
- **TENNIS_MATCH_SCORE**: Total sets won
- **TENNIS_DETAILED_SET_SCORE**: Individual set score
- **TENNIS_SERVING_INDICATOR**: Serving player indicator
- **TENNIS_SET_1** through **TENNIS_SET_5**: Combined set scores (e.g., "6-4")
- **PLAYER1_SET1** through **PLAYER2_SET5**: Individual player set scores

## 🔌 Live Data Integration

The application supports multiple integration methods:

### WebSocket (Recommended)
```typescript
// Connect to real-time tennis data
connectToWebSocket('wss://your-api.com/tennis?token=xxx');
```

### REST API Polling
```typescript
// Poll HTTP endpoint every 2 seconds
connectToApi('https://your-api.com/match/current', 2000);
```

### Expected Data Format
```json
{
  "matchId": "match_001",
  "player1": { "name": "Player One", "country": "USA" },
  "player2": { "name": "Player Two", "country": "GBR" },
  "score": {
    "player1Sets": 2,
    "player2Sets": 1,
    "player1Games": 6,
    "player2Games": 4,
    "player1Points": "40",
    "player2Points": "30"
  },
  "sets": {
    "set1": { "player1": 6, "player2": 4 },
    "set2": { "player1": 4, "player2": 6 },
    "set3": { "player1": 6, "player2": 4 }
  },
  "servingPlayer": 1,
  "currentSet": 3
}
```

For complete integration documentation, see [TENNIS_DATA_INTEGRATION.md](TENNIS_DATA_INTEGRATION.md).

## 📦 Export & Import

### Export Scoreboard
1. Click "Export ZIP" in the header
2. Choose save location
3. ZIP file includes:
   - Scoreboard design (JSON)
   - All referenced images
   - All referenced videos
   - Complete package ready to share

### Import Scoreboard
1. Click "Import ZIP" in the header
2. Select ZIP file
3. Scoreboard and all assets are imported
4. Ready to use immediately

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Rust idiomatic patterns
- Write clear commit messages
- Add tests for new features
- Update documentation as needed

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start Vite dev server |
| `yarn build` | Build frontend (TypeScript + Vite) |
| `yarn preview` | Preview production build |
| `yarn tauri dev` | Run Tauri in development mode |
| `yarn tauri build` | Build production application |

## 🐛 Troubleshooting

### Application Won't Start
- Ensure Rust is installed: `rustc --version`
- Update Tauri CLI: `cargo install tauri-cli@^2.0`
- Clear node_modules: `rm -rf node_modules && yarn install`

### WebSocket Connection Fails
- Check URL format (must start with `ws://` or `wss://`)
- Verify CORS settings on server
- Check firewall/network restrictions
- Review browser console for errors

### Scoreboard Not Displaying on Monitor
- Ensure target monitor is connected
- Check monitor permissions in OS
- Try closing and reopening scoreboard window
- Verify scoreboard instance is active

### Images Not Loading
- Check image file format (PNG, JPG, GIF supported)
- Verify image size (max 10MB recommended)
- Ensure images are properly uploaded to Image Manager
- Check file permissions

For more help, see [TENNIS_DATA_INTEGRATION.md](TENNIS_DATA_INTEGRATION.md).

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Tauri](https://tauri.app/) - The secure desktop framework
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- Tennis data integration supports [IonCourt](https://ioncourt.com/)

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Check [TENNIS_DATA_INTEGRATION.md](TENNIS_DATA_INTEGRATION.md) for integration help
- Review [plan.md](plan.md) for development roadmap

---

**Made with ❤️ for the tennis community**
