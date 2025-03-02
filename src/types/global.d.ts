
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
    };
  };
  difficulty: 'easy' | 'normal' | 'hard';
}

interface BassController {
  update: (delta: number) => void;
  handleHit: (quality?: string) => void;
  position?: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
}

interface GameState {
  score: number;
  combo: number;
  isPlaying: boolean;
}

type HitQuality = 'perfect' | 'good' | 'ok' | 'miss';

interface HitResult {
  hit: boolean;
  quality: HitQuality;
}

declare global {
  interface Window {
    gameConfig?: GameConfig;
    gameAnimationFunctions?: Array<(delta: number) => void>;
    gameBass?: THREE.Object3D;
    gameScene?: THREE.Scene;
    bassController?: BassController;
    rhythmEngine?: RhythmEngine;
    _debugLogs?: Array<LogEntry>;
    
    // Global game state
    gameState?: GameState;
    
    // Function to check hit timing
    checkHit?: () => HitResult;
    
    // Global AudioManager
    AudioManager?: {
      getInstance: () => AudioManager;
    };
    
    // Custom events
    addEventListener(
      type: 'game:hit',
      listener: (event: CustomEvent<{
        quality: HitQuality;
        targetElement: HTMLElement | null;
      }>) => void,
      options?: boolean | AddEventListenerOptions
    ): void;
    removeEventListener(
      type: 'game:hit',
      listener: (event: CustomEvent) => void,
      options?: boolean | EventListenerOptions
    ): void;
    dispatchEvent(event: Event): boolean;
  }
}

export {};
