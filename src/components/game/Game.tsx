
import React, { useState, useEffect } from 'react';
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
    combo,
    loadedComponents, 
    showInstructions,
    startGame,
    handleGameOver,
    handleRestart
  } = useGameState({ onGameOver });
  
  const [timingFeedback, setTimingFeedback] = useState<string | null>(null);

  // Setup input handlers
  useGameInput({ gameState });
  
  // Update timing feedback from gameState
  useEffect(() => {
    if (window.gameState && window.gameState.timingFeedback) {
      setTimingFeedback(window.gameState.timingFeedback);
      
      // Clear timing feedback after 1 second
      const timer = setTimeout(() => {
        setTimingFeedback(null);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [score, combo]); // Update when score or combo changes

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
          {/* Enhanced score display */}
          <div className="score fixed top-4 left-4 p-4 bg-black/60 text-white rounded-lg shadow-lg">
            <div className="text-2xl font-bold">
              Score: <span className="text-yellow-400">{score}</span>
            </div>
            <div className="flex items-center mt-1">
              <span className="mr-2">Combo:</span>
              <span className={`text-xl font-bold ${combo >= 10 ? 'text-green-400' : combo >= 5 ? 'text-yellow-400' : 'text-white'}`}>
                {combo}x
              </span>
            </div>
            {window.gameState?.perfectCount && (
              <div className="mt-1 text-sm">
                Perfect Hits: <span className="text-green-400">{window.gameState.perfectCount}</span>
              </div>
            )}
          </div>
          
          {/* Timing feedback display */}
          {timingFeedback && (
            <div className={`fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                           text-2xl font-bold px-4 py-2 rounded-lg bg-black/40
                           ${timingFeedback === 'PERFECT' ? 'text-green-400' : 
                             timingFeedback === 'EARLY' ? 'text-yellow-400' : 'text-red-400'}`}>
              {timingFeedback}
            </div>
          )}
          
          {!loadedComponents.beatVisualizer && (
            <div className="loading absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white p-4 rounded text-lg">
              Loading game components...
            </div>
          )}
          
          {showInstructions && (
            <div className="instructions absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-black/70 text-white p-5 rounded-lg text-lg max-w-md">
              <h3 className="font-bold text-yellow-300 mb-2">Slik spiller du:</h3>
              <p>Trykk på <strong className="text-green-400">mellomrom</strong> når de hvite sirklene er i midten av ringen</p>
              <p className="mt-1">Perfekt timing gir høyest poeng!</p>
              <div className="mt-3 text-sm">
                <p><span className="text-green-400">PERFECT</span> = 100 poeng × combo</p>
                <p><span className="text-yellow-400">GOOD</span> = 50 poeng × combo</p>
                <p><span className="text-blue-400">OK</span> = 10 poeng × combo</p>
                <p className="mt-2"><strong>BONUS:</strong> +500 poeng hver 10. perfekte treff!</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {gameState === 'gameover' && (
        <div className="ui-overlay absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/70 text-white">
          <h2 className="text-3xl font-bold mb-4">Game Over</h2>
          
          <div className="bg-slate-800/80 p-6 rounded-lg shadow-lg mb-6 w-full max-w-md">
            <h3 className="text-2xl font-semibold mb-4 text-center">Din score</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between border-b border-slate-600 pb-2">
                <span className="text-slate-300">Poeng:</span>
                <span className="text-2xl font-bold text-yellow-400">{score}</span>
              </div>
              
              <div className="flex justify-between border-b border-slate-600 pb-2">
                <span className="text-slate-300">Perfekte treff:</span>
                <span className="text-xl font-bold text-green-400">
                  {window.gameState?.perfectCount || 0}
                </span>
              </div>
              
              <div className="flex justify-between pb-2">
                <span className="text-slate-300">Lengste combo:</span>
                <span className="text-xl font-bold text-blue-400">
                  {window.gameState?.maxCombo || 0}x
                </span>
              </div>
            </div>
          </div>
          
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
