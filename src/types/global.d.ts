
interface Window {
  _debugLogs: Array<{
    level: "info" | "error" | "warn";
    message: string;
    timestamp: Date;
  }>;
  checkHit?: () => { hit: boolean; quality: string };
  gameState?: {
    score: number;
    combo: number;
    isPlaying: boolean;
  };
  gameScene?: THREE.Scene;
  gameBass?: THREE.Object3D;
  bassController?: any;
  gameAnimationFunctions?: Array<(deltaTime: number) => void>;
  gameConfig?: {
    physics: {
      lov: {
        enabled: boolean;
        maxSpeed: number;
        gravity: number;
        airResistance: number;
        bounceFactor: number;
      }
    };
    difficulty: string;
  };
  beatGenerator?: NodeJS.Timeout;
  AudioManager?: {
    getInstance: () => import('../utils/AudioManager').AudioManager;
  };
}
