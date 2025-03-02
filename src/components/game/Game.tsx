
import React from 'react';
import GameCanvas from './GameCanvas';
import { Button } from "@/components/ui/button";
import Bass from './Bass';
import DebugPanel from '@/components/debug/DebugPanel';
import BeatVisualizer from './BeatVisualizer';
import useGameState from '@/hooks/useGameState';
import useGameInput from '@/hooks/useGameInput';

interface GameProps {
  onGameOver: (score: number, perfectHits?: number, maxCombo?: number) => void;
}

const Game = ({ onGameOver }: GameProps) => {
  const { 
    gameState, 
    countdownNumber, 
    score, 
    loadedComponents, 
    showInstructions,
    startGame,
    handleGameOver,
    handleRestart
  } = useGameState({ onGameOver });
  
  // Setup input handlers
  useGameInput({ gameState });

  return (
    <div className="game-container relative w-screen h-screen overflow-hidden">
      {/* GameCanvas is always rendered */}
      <GameCanvas gameState={gameState}>
        {/* Conditionally render Bass component */}
        {gameState === 'playing' && loadedComponents.bass && <Bass />}
        {/* Conditionally render BeatVisualizer component */}
        {gameState === 'playing' && loadedComponents.beatVisualizer && <BeatVisualizer />}
      </GameCanvas>
      
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
          <div className="combo m-4 mt-14 p-3 bg-black/50 text-white rounded text-xl">
            Combo: {window.gameState?.combo || 0}
          </div>
          {!loadedComponents.beatVisualizer && (
            <div className="loading absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white p-4 rounded text-lg">
              Loading game components...
            </div>
          )}
          {showInstructions && (
            <div className="instructions absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-black/70 text-white p-3 rounded-lg text-lg max-w-md">
              <h3 className="font-bold text-yellow-300 mb-2">Slik spiller du:</h3>
              <p>Trykk på <strong className="text-green-400">mellomrom</strong> når de hvite sirklene er i midten av ringen</p>
              <p className="mt-1">Perfekt timing gir høyest poeng!</p>
            </div>
          )}
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
      
      {/* Always render DebugPanel */}
      <DebugPanel />
    </div>
  );
};

export default Game;
