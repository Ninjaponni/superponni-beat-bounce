
import { useEffect } from 'react';
import { GameStateType } from './useGameState';

interface UseGameInputProps {
  gameState: GameStateType;
}

export function useGameInput({ gameState }: UseGameInputProps) {
  // Handle player input
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    // Handle space key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        if (typeof window.checkHit === 'function') {
          window.checkHit();
        }
      }
    };
    
    // Handle click events (if not handled by BeatVisualizer)
    const handleClick = () => {
      if (typeof window.checkHit === 'function') {
        window.checkHit();
      }
    };
    
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClick);
    };
  }, [gameState]);
}

export default useGameInput;
