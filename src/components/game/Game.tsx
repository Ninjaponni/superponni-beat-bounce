
import React, { useState } from 'react';
import GameCanvas from './GameCanvas';
import { Button } from "@/components/ui/button";

interface GameProps {
  onGameOver: (score: number, perfectHits?: number, maxCombo?: number) => void;
}

const Game = ({ onGameOver }: GameProps) => {
  const [gameState, setGameState] = useState<'start' | 'countdown' | 'playing' | 'gameover'>('start');
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [score, setScore] = useState(0);
  
  // Simple start game function
  const startGame = () => {
    console.log("Starting countdown");
    setGameState('countdown');
    setCountdownNumber(3);
    
    // Simulate countdown with setTimeout
    setTimeout(() => {
      setCountdownNumber(2);
      setTimeout(() => {
        setCountdownNumber(1);
        setTimeout(() => {
          console.log("Countdown finished, starting game");
          setGameState('playing');
        }, 1000);
      }, 1000);
    }, 1000);
  };
  
  // Handle game over
  const handleGameOver = () => {
    setGameState('gameover');
    onGameOver(score);
  };
  
  // Handle restart
  const handleRestart = () => {
    setGameState('start');
    setScore(0);
  };

  return (
    <div className="game-container relative w-screen h-screen overflow-hidden">
      {/* GameCanvas is always rendered */}
      <GameCanvas gameState={gameState} />
      
      {/* UI overlays based on game state */}
      {gameState === 'start' && (
        <div className="ui-overlay absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/70 text-white">
          <h1 className="text-4xl font-bold mb-8">Superponni: Kom å Spælla Basse</h1>
          <Button 
            onClick={startGame}
            className="text-xl px-8 py-6 bg-green-600 hover:bg-green-700"
          >
            Start Spill
          </Button>
        </div>
      )}
      
      {gameState === 'countdown' && (
        <div className="ui-overlay absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/70">
          <div className="text-9xl font-bold text-white">{countdownNumber}</div>
        </div>
      )}
      
      {gameState === 'playing' && (
        <div className="ui-overlay absolute inset-0 pointer-events-none z-10">
          <div className="score m-4 p-3 bg-black/50 text-white rounded text-xl">
            Score: {score}
          </div>
          <div className="instructions absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black/50 text-white p-3 rounded text-lg">
            Trykk på mellomrom for å sparke bassen
          </div>
        </div>
      )}
      
      {gameState === 'gameover' && (
        <div className="ui-overlay absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/70 text-white">
          <h2 className="text-3xl font-bold mb-4">Game Over</h2>
          <p className="text-xl mb-8">Din score: {score}</p>
          <Button 
            onClick={handleRestart}
            className="text-xl px-6 py-4 bg-green-600 hover:bg-green-700"
          >
            Spill Igjen
          </Button>
        </div>
      )}
    </div>
  );
};

export default Game;
