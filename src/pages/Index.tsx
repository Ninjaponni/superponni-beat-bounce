
import { useState, useEffect } from 'react';
import Game from '@/components/game/Game';
import StartScreen from '@/components/game/StartScreen';
import GameOverScreen from '@/components/game/GameOverScreen';
import { toast } from "sonner";

export type GameState = 'start' | 'playing' | 'gameover';

interface GameStats {
  score: number;
  perfectHits: number;
  maxCombo: number;
}

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    perfectHits: 0,
    maxCombo: 0
  });
  const [transitioning, setTransitioning] = useState(false);
  
  const startGame = () => {
    setTransitioning(true);
    toast.info("Bereder spillet...");
    
    // Add a small delay for better user experience 
    setTimeout(() => {
      setGameState('playing');
      setGameStats({
        score: 0,
        perfectHits: 0,
        maxCombo: 0
      });
      setTransitioning(false);
    }, 500);
  };

  const endGame = (finalScore: number, perfectHits: number = 0, maxCombo: number = 0) => {
    setGameStats({
      score: finalScore,
      perfectHits,
      maxCombo
    });
    setTransitioning(true);
    
    // Add a delay to let any final animations complete
    setTimeout(() => {
      setGameState('gameover');
      setTransitioning(false);
    }, 500);
  };

  const restartGame = () => {
    setTransitioning(true);
    
    // Add a small delay for better user experience
    setTimeout(() => {
      setGameState('start');
      setTransitioning(false);
    }, 500);
  };

  // Keyboard shortcut to restart the game with 'R' key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyR' && gameState === 'gameover') {
        restartGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-900">
      {/* Transition overlay */}
      {transitioning && (
        <div className="absolute inset-0 bg-black z-50 animate-fade-in"></div>
      )}
      
      {gameState === 'start' && (
        <StartScreen onStart={startGame} />
      )}
      
      {gameState === 'playing' && (
        <Game onGameOver={endGame} />
      )}
      
      {gameState === 'gameover' && (
        <GameOverScreen 
          score={gameStats.score} 
          onRestart={restartGame}
          perfectHits={gameStats.perfectHits}
          maxCombo={gameStats.maxCombo}
        />
      )}
    </div>
  );
};

export default Index;
