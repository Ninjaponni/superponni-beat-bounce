
// Global types for the game
interface Window {
  gameConfig?: {
    physics: {
      lov: {
        enabled: boolean;
        gravity: number;
        airResistance: number;
        bounceFactor: number;
        maxSpeed?: number;
      }
    },
    difficulty: string;
  };
  gameScene?: THREE.Scene;
  gameBass?: THREE.Object3D;
  gameState?: {
    score: number;
    combo: number;
    isPlaying: boolean;
  };
  gameAnimationFunctions?: Function[];
  bassController?: any;
  beatGenerator?: NodeJS.Timeout;
  checkHit?: () => { hit: boolean, quality: string };
  _debugLogs?: Array<{
    level: 'info' | 'warn' | 'error';
    message: string;
    timestamp: Date;
  }>;
}
