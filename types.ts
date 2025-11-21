export interface ReferenceFace {
  id: string;
  name: string;
  data: string; // Base64 string
  mimeType: string;
}

export interface MatchResult {
  matchFound: boolean;
  matchedName: string | null;
  confidence: number; // 0 to 1
  maskDetected: boolean;
  reasoning: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  matchedName: string;
  thumbnail: string; // Base64 of the captured frame
  maskDetected: boolean;
  confidence: number;
}

export enum AppState {
  IDLE = 'IDLE',
  MONITORING = 'MONITORING',
  PROCESSING = 'PROCESSING', // Transient state during API call
}