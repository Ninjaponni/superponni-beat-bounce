
// Extend Window interface with our global objects
interface Window {
  gameScene?: THREE.Scene;
  checkHit?: () => { hit: boolean, quality: string };
  bassController?: import('../lib/BassController').BassController;
  gameBass?: THREE.Object3D;
  gameState?: {
    score: number;
    combo: number;
    isPlaying: boolean;
  };
  gameConfig?: {
    physics: {
      bass: {
        enabled: boolean;
        gravity: number;
        airResistance: number;
        bounceFactor: number;
        maxSpeed: number;
      };
    };
    difficulty: string;
  };
  gameAnimationFunctions?: Array<() => void>;
  AudioManager?: {
    getInstance: () => import('../utils/AudioManager').default;
  };
  rhythmEngine?: import('../utils/RhythmEngine').default;
  _debugLogs?: string[];
}
