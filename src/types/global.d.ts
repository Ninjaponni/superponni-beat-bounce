
import * as THREE from 'three';
import { BassController } from '@/lib/BassController';

interface GameState {
  score: number;
  combo: number;
  isPlaying: boolean;
}

interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
}

declare global {
  interface Window {
    // Game objects
    gameScene: THREE.Scene;
    gameCamera: THREE.Camera;
    gameBass: THREE.Object3D;
    bassController: BassController;
    gameAnimationFunctions: Array<(deltaTime: number) => void>;
    
    // Game state
    gameState: GameState;
    
    // Beat visualization
    checkHit: () => { hit: boolean; quality: string };
    beatGenerator: ReturnType<typeof setInterval>;
    
    // Game configuration
    gameConfig: {
      physics: {
        lov: {
          enabled: boolean;
          gravity: number;
          airResistance: number;
          bounceFactor: number;
          maxSpeed: number;
        }
      };
      difficulty: string;
    };
    
    // Debug
    _debugLogs: LogEntry[];
    
    // Audio
    AudioManager: { getInstance: () => any };
  }
}

export {};
