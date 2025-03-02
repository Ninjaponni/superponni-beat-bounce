
import { RhythmEngine } from '../utils/RhythmEngine';
import AudioManager from '../utils/AudioManager';

interface GameConfig {
  physics: {
    bass: {
      enabled: boolean;
      gravity: number;
      airResistance: number;
      bounceFactor: number;
      maxSpeed: number;
    }
  };
  difficulty: 'easy' | 'normal' | 'hard';
}

interface BassController {
  update: (deltaTime: number) => void;
  handleHit: (hitQuality?: string) => void;
}

interface LogEntry {
  level: "info" | "warn" | "error";
  message: string;
  timestamp: Date;
}

interface GameState {
  score: number;
  combo: number;
  isPlaying: boolean;
}

declare global {
  interface Window {
    gameConfig?: GameConfig;
    gameScene?: THREE.Scene;
    gameBass?: THREE.Object3D;
    gameAnimationFunctions?: Array<(deltaTime: number) => void>;
    bassController?: BassController;
    rhythmEngine?: RhythmEngine;
    _debugLogs?: Array<LogEntry>;
    
    // Add missing global properties that caused TypeScript errors
    gameState?: GameState;
    checkHit?: () => { hit: boolean; quality: string };
    AudioManager?: {
      getInstance: () => AudioManager;
    };
  }
}
