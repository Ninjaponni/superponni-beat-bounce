
import { useEffect, useState } from 'react';
import Game from '@/components/game/Game';
import StartScreen from '@/components/game/StartScreen';
import GameOverScreen from '@/components/game/GameOverScreen';

export type GameState = 'start' | 'playing' | 'gameover';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  
  const startGame = () => {
    setGameState('playing');
    setScore(0);
  };

  const endGame = (finalScore: number) => {
    setScore(finalScore);
    setGameState('gameover');
  };

  const restartGame = () => {
    setGameState('start');
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-900">
      {gameState === 'start' && (
        <StartScreen onStart={startGame} />
      )}
      
      {gameState === 'playing' && (
        <Game onGameOver={endGame} />
      )}
      
      {gameState === 'gameover' && (
        <GameOverScreen score={score} onRestart={restartGame} />
      )}
    </div>
  );
};

export default Index;
