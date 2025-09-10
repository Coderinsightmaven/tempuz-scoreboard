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
  BACKGROUND = 'background',
  LOGO = 'logo',
  TEXT = 'text',
  VIDEO = 'video',
  TENNIS_PLAYER_NAME = 'tennis_player_name',
  TENNIS_DOUBLES_PLAYER_NAME = 'tennis_doubles_player_name',
  TENNIS_GAME_SCORE = 'tennis_game_score',
  TENNIS_SET_SCORE = 'tennis_set_score',
  TENNIS_MATCH_SCORE = 'tennis_match_score',
  TENNIS_DETAILED_SET_SCORE = 'tennis_detailed_set_score',
  TENNIS_SERVING_INDICATOR = 'tennis_serving_indicator',
  // Player-specific set score components
  PLAYER1_SET1 = 'player1_set1',
  PLAYER2_SET1 = 'player2_set1',
  PLAYER1_SET2 = 'player1_set2',
  PLAYER2_SET2 = 'player2_set2',
  PLAYER1_SET3 = 'player1_set3',
  PLAYER2_SET3 = 'player2_set3',
  PLAYER1_SET4 = 'player1_set4',
  PLAYER2_SET4 = 'player2_set4',
  PLAYER1_SET5 = 'player1_set5',
  PLAYER2_SET5 = 'player2_set5',
  // Individual set components
  TENNIS_SET_1 = 'tennis_set_1',
  TENNIS_SET_2 = 'tennis_set_2',
  TENNIS_SET_3 = 'tennis_set_3',
  TENNIS_SET_4 = 'tennis_set_4',
  TENNIS_SET_5 = 'tennis_set_5',
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
  videoId?: string;
  teamId?: string;
  format?: string;
  // Video-specific data
  videoData?: {
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
    volume?: number;
    playbackRate?: number;
    scaleMode?: 'cover' | 'contain' | 'stretch' | 'original';
  };
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
  work_area_width: number;
  work_area_height: number;
  work_area_x: number;
  work_area_y: number;
}

export interface ScoreboardInstance {
  id: string;
  windowId: string;
  name: string;
  monitorId: number;
  position: {
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  };
  size: {
    width: number;
    height: number;
  };
  isActive: boolean;
  createdAt: Date;
  scoreboardData?: any; // Saved scoreboard configuration and components
  tennisApiScoreboardId?: string; // Which tennis API scoreboard to listen to for live data
}

// Live Data Types for integration with external APIs
export interface LiveDataConnection {
  id: string;
  name: string;
  provider: 'mock' | 'api' | 'tennis_api';
  apiUrl?: string;
  token?: string;
  pollInterval: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastUpdated?: Date;
  lastError?: string;
}

export interface TennisLiveData {
  matchId: string;
  // Singles players (backward compatibility)
  player1?: {
    name: string;
    country?: string;
    seed?: number;
  };
  player2?: {
    name: string;
    country?: string;
    seed?: number;
  };
  // Doubles players
  doublesPlayers?: {
    team1: {
      player1: {
        name: string;
        country?: string;
        seed?: number;
      };
      player2: {
        name: string;
        country?: string;
        seed?: number;
      };
    };
    team2: {
      player1: {
        name: string;
        country?: string;
        seed?: number;
      };
      player2: {
        name: string;
        country?: string;
        seed?: number;
      };
    };
  };
  score: {
    player1Sets?: number;
    player2Sets?: number;
    player1Games?: number;
    player2Games?: number;
    player1Points?: string;
    player2Points?: string;
    // Doubles scoring
    team1Sets?: number;
    team2Sets?: number;
    team1Games?: number;
    team2Games?: number;
    team1Points?: string;
    team2Points?: string;
  };
  sets: Record<string, {
    player1?: number;
    player2?: number;
    team1?: number;
    team2?: number;
  }>;
  serve?: {
    speed?: string;
  };
  matchStatus: 'not_started' | 'in_progress' | 'completed' | 'suspended';
  servingPlayer: 1 | 2 | 3 | 4; // Support for 4 players in doubles
  currentSet: number;
  isTiebreak: boolean;
  matchType?: 'singles' | 'doubles';
}

export interface LiveDataComponentBinding {
  componentId: string;
  connectionId: string;
  dataPath: string;
  updateInterval?: number;
}

// IonCourt WebSocket payload types
export interface IonCourtMatchMessage {
  type: "MATCH";
  data: IonCourtMatchData;
}

export interface IonCourtMatchData {
  id: string;
  matchId: string;
  matchFormat: string;
  matchStatus: "IN_PROGRESS" | "COMPLETED" | "NOT_STARTED" | "SUSPENDED";
  matchType: "SINGLES" | "DOUBLES";
  sides: IonCourtSide[];
  score: IonCourtScore;
  clocks: IonCourtClock[];
  court: string;
  isUndo: boolean;
  playerCourtTimeLog: IonCourtTimeLog;
  substituteTracker: IonCourtSubstituteTracker;
  isStartPoint: boolean;
  isEndPoint: boolean;
}

export interface IonCourtSide {
  sideNumber: 1 | 2;
  participant: any;
  players: IonCourtPlayer[];
  _id: string;
}

export interface IonCourtPlayer {
  playerNumber: 1 | 2;
  participant: {
    _id: string;
    first_name: string;
    last_name: string;
    biographicalInformation: {
      sex: string;
      playingHand: string;
      doubleHandedForehand: boolean;
      doubleHandedBackhand: boolean;
      national: any;
      itf: any;
      atpwta: any;
      utr: any;
    };
  };
  biographicalInformation: {
    sex: string;
    playingHand: string;
    doubleHandedForehand: boolean;
    doubleHandedBackhand: boolean;
    national: any;
    itf: any;
    atpwta: any;
    utr: any;
  };
}

export interface IonCourtScore {
  scoreStringSide1: string;
  scoreStringSide2: string;
  side1PointScore: string;
  side2PointScore: string;
  server: IonCourtServer;
  sets: IonCourtSet[];
  _id: string;
}

export interface IonCourtServer {
  sideNumber: 1 | 2;
  playerNumber: 1 | 2;
  player: string;
  returningSide: "AD" | "DEUCE";
  _id: string;
}

export interface IonCourtSet {
  setNumber: number;
  side1Score: number;
  side1TiebreakScore: number | null;
  side2Score: number;
  side2TiebreakScore: number | null;
  _id: string;
  games: any[];
  returnerCourtSides: any[];
  serverPickleballOrders: any[];
  isCompleted: boolean;
}

export interface IonCourtClock {
  name: string;
  type: string;
  defaultValue: number;
  displayValue: string;
  adjustTime: number;
  timePipe: string;
  value: number;
  isPaused: boolean;
  timeoutPerSet: number;
  timeoutPerMatch: number;
  _id: string;
}

export interface IonCourtTimeLog {
  side1: IonCourtPlayerTime[];
  side2: IonCourtPlayerTime[];
}

export interface IonCourtPlayerTime {
  player: {
    biographicalInformation: any;
    _id: string;
    first_name: string;
    last_name: string;
  };
  playerNumber: 1 | 2;
  sideNumber: 1 | 2;
  inTime: string;
  outTime: string | null;
  substitutedBy: any;
  substitutedAt: any;
  performedBy: string;
  isReverted: boolean;
  setNumber: number;
  inPointNumber: number;
  outSetNumber: number | null;
}

export interface IonCourtSubstituteTracker {
  side1: any[];
  side2: any[];
}

// Tennis API types are now defined in lib/tauri.ts for cleaner organization