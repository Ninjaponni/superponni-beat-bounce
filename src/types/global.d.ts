
import * as THREE from 'three';

interface GameConfig {
  physics: {
    lov: {
      enabled: boolean;
      gravity: number;
      airResistance: number;
      bounceFactor: number;
      maxSpeed?: number;
    }
  };
  difficulty: string;
}

// Global objects accessible on window
declare global {
  interface Window {
    gameConfig: GameConfig;
    gameScene?: THREE.Scene;
    gameCamera?: THREE.Camera;
    gameBass?: THREE.Object3D;
    bassController?: any;
    checkHit?: () => { hit: boolean; quality: string };
    gameState?: {
      score: number;
      combo: number;
      isPlaying: boolean;
    };
    gameAnimationFunctions?: Array<(deltaTime: number) => void>;
    beatGenerator?: NodeJS.Timeout;
  }
}

export {};
