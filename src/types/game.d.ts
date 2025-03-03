
// Type definitions for game state
import { TimingFeedback } from '@/components/game/BeatVisualizer';

declare global {
  interface Window {
    gameState: {
      score: number;
      combo: number;
      maxCombo: number;
      perfectCount: number;
      lives: number;
      timingFeedback: TimingFeedback;
    };
    rhythmEngine: any;
    bassController: {
      handleHit: (quality: string) => void;
    };
    checkHit: () => {
      hit: boolean;
      quality: string;
      timing?: 'early' | 'perfect' | 'late';
    };
  }
}

export {};
