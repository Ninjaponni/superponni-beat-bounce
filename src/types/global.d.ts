
interface Window {
  // Game state and management
  gameState?: {
    score: number;
    combo: number;
    perfectCount: number;
    maxCombo: number;
    isPlaying: boolean;
    timingFeedback?: 'EARLY' | 'PERFECT' | 'LATE' | null;
  };
  gameConfig?: {
    physics: {
      bass: {
        enabled: boolean;
        gravity: number;
        airResistance: number;
        bounceFactor: number;
        maxSpeed: number;
      }
    };
    difficulty: string;
    audio: {
      enabled: boolean;
      volume: number;
    };
  };
  gameScene?: THREE.Scene;
  gameBass?: THREE.Object3D;
  gameAnimationFunctions?: Array<(delta?: number) => void>;
  _debugLogs?: any[];
  
  // Utility functions and classes
  bassController?: {
    update(deltaTime: number): void;
    handleHit(quality: string): void;
  };
  checkHit?: () => { hit: boolean; quality: string; timing?: 'early' | 'perfect' | 'late' };
  rhythmEngine?: any;
  
  // Audio management
  AudioManager?: {
    getInstance: () => any;
  };
}

// Make sure LogLevel is consistent between files
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
}
