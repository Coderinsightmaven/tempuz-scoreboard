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
  // Tennis-specific components
  TENNIS_SET_SCORE = 'tennis-set-score',
  TENNIS_GAME_SCORE = 'tennis-game-score',
  TENNIS_CURRENT_GAME = 'tennis-current-game',
  TENNIS_SERVER_INDICATOR = 'tennis-server-indicator',
  TENNIS_PLAYER_NAME = 'tennis-player-name',
  TENNIS_MATCH_STATUS = 'tennis-match-status',
  TENNIS_TIEBREAK_SCORE = 'tennis-tiebreak-score',
  // Background component with RGB
  BACKGROUND_COLOR = 'background-color',
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

export interface ComponentStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
  // RGB color settings
  rgbColor?: {
    r: number;
    g: number;
    b: number;
    a?: number; // alpha for transparency
  };
}

export interface ComponentData {
  text?: string;
  value?: number | string;
  imageUrl?: string;
  imageId?: string;
  teamId?: string;
  format?: string;
  // Tennis-specific data
  tennisData?: {
    player1SetScore?: number;
    player2SetScore?: number;
    player1GameScore?: string; // "0", "15", "30", "40", "A", "D"
    player2GameScore?: string;
    player1CurrentGame?: number;
    player2CurrentGame?: number;
    servingPlayer?: 1 | 2;
    matchFormat?: 'best-of-3' | 'best-of-5';
    isTiebreak?: boolean;
    tiebreakScore?: {
      player1: number;
      player2: number;
    };
  };
  [key: string]: any;
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
  createdAt: Date;
  updatedAt: Date;
}

export const enum SportType {
  BASKETBALL = 'basketball',
  FOOTBALL = 'football',
  SOCCER = 'soccer',
  HOCKEY = 'hockey',
  BASEBALL = 'baseball',
  VOLLEYBALL = 'volleyball',
  TENNIS = 'tennis',
  GENERIC = 'generic',
}

export interface Team {
  id: string;
  name: string;
  abbreviation?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface GameState {
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  period: number;
  timeRemaining: string;
  isGameActive: boolean;
  sport: SportType;
  metadata: Record<string, any>;
}

export interface CanvasState {
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