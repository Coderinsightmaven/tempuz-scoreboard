// Types for composite scoreboard layouts with multiple scoreboards in one display

export interface CompositeScoreboardArea {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scoreboardId?: string; // Reference to a saved scoreboard design
  scoreboardData?: any; // Inline scoreboard data
}

export interface CompositeScoreboardLayout {
  id: string;
  name: string;
  totalWidth: number;
  totalHeight: number;
  areas: CompositeScoreboardArea[];
  background: {
    color: string;
    image?: string;
    opacity: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CompositeScoreboardInstance {
  id: string;
  layoutId: string;
  name: string;
  windowId: string;
  monitorId: number;
  areas: CompositeScoreboardArea[];
  createdAt: Date;
}

// Preset layout configurations
export const PRESET_LAYOUTS = {
  MAIN_PLUS_PIP: {
    id: 'main_plus_pip',
    name: 'Main + Picture-in-Picture',
    totalWidth: 1920,
    totalHeight: 1080,
    areas: [
      {
        id: 'main',
        name: 'Main Scoreboard',
        x: 0,
        y: 0,
        width: 896,
        height: 512
      },
      {
        id: 'pip',
        name: 'Picture-in-Picture',
        x: 0,
        y: 512,
        width: 384,
        height: 256
      }
    ]
  },
  DUAL_HORIZONTAL: {
    id: 'dual_horizontal',
    name: 'Dual Horizontal Split',
    totalWidth: 1920,
    totalHeight: 1080,
    areas: [
      {
        id: 'left',
        name: 'Left Scoreboard',
        x: 0,
        y: 0,
        width: 960,
        height: 1080
      },
      {
        id: 'right',
        name: 'Right Scoreboard',
        x: 960,
        y: 0,
        width: 960,
        height: 1080
      }
    ]
  },
  QUAD_SPLIT: {
    id: 'quad_split',
    name: 'Quad Split',
    totalWidth: 1920,
    totalHeight: 1080,
    areas: [
      {
        id: 'top_left',
        name: 'Top Left',
        x: 0,
        y: 0,
        width: 960,
        height: 540
      },
      {
        id: 'top_right',
        name: 'Top Right',
        x: 960,
        y: 0,
        width: 960,
        height: 540
      },
      {
        id: 'bottom_left',
        name: 'Bottom Left',
        x: 0,
        y: 540,
        width: 960,
        height: 540
      },
      {
        id: 'bottom_right',
        name: 'Bottom Right',
        x: 960,
        y: 540,
        width: 960,
        height: 540
      }
    ]
  }
} as const;