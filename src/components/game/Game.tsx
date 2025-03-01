
import React, { useState, useEffect } from 'react';
import GameCanvas from './GameCanvas';
import { Button } from "@/components/ui/button";
import Bass from './Bass';
import DebugPanel from '@/components/debug/DebugPanel';
import BeatVisualizer from './BeatVisualizer';
import { toast } from "sonner";
import AudioManager from '@/utils/AudioManager';

interface GameProps {
  onGameOver: (score: number, perfectHits?: number, maxCombo?: number) => void;
}

const Game = ({ onGameOver }: GameProps) => {
  const [gameState, setGameState] = useState<'start' | 'countdown' | 'playing' | 'gameover'>('start');
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [score, setScore] = useState(0);
  const [loadedComponents, setLoadedComponents] = useState({
    bass: false,
    beatVisualizer: false
  });
  const [showInstructions, setShowInstructions] = useState(true);
  
  // Initialize audio when component mounts
  useEffect(() => {
    const initAudio = async () => {
      try {
        const audioManager = AudioManager.getInstance();
        
        // Preload audio files
        await audioManager.loadAllSounds();
        
        // Make AudioManager globally accessible
        window.AudioManager = { getInstance: () => audioManager };
        
        console.log("Audio successfully initialized");
      } catch (error) {
        console.error("Error initializing audio:", error);
      }
    };
    
    // Initialize debug logs if not already done
    if (!window._debugLogs) {
      window._debugLogs = [];
    }
    
    initAudio();
  }, []);
  
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
          handleCountdownComplete();
        }, 1000);
      }, 1000);
    }, 1000);
  };
  
  // Handle countdown completion
  const handleCountdownComplete = () => {
    try {
      console.log('Countdown complete, starting game');
      
      // Create global animation functions array
      window.gameAnimationFunctions = [];
      
      // Initialize game state
      window.gameState = {
        score: 0,
        combo: 0,
        isPlaying: true
      };
      
      // Create global config with 'lov' property
      window.gameConfig = {
        physics: {
          lov: {
            enabled: true,
            gravity: 9.8,
            airResistance: 0.99,
            bounceFactor: 0.8,
            maxSpeed: 5
          }
        },
        difficulty: 'normal'
      };
      
      // Start the game
      setGameState('playing');
      setShowInstructions(true);
      
      // Hide instructions after 8 seconds
      setTimeout(() => {
        setShowInstructions(false);
      }, 8000);
      
      // Load components gradually
      setTimeout(() => {
        console.log("Loading Bass component");
        setLoadedComponents(prev => ({ ...prev, bass: true }));
        
        setTimeout(() => {
          console.log("Loading BeatVisualizer component");
          setLoadedComponents(prev => ({ ...prev, beatVisualizer: true }));
          
          // Start background music
          try {
            const audioManager = AudioManager.getInstance();
            audioManager.playMusic('music', 0.7);
          } catch (error) {
            console.error("Failed to start music:", error);
          }
        }, 500);
      }, 500);
    } catch (error) {
      console.error("Error starting game:", error);
      // Continue to playing state even if there's an error
      setGameState('playing');
    }
  };
  
  // Handle game over
  const handleGameOver = () => {
    setGameState('gameover');
    
    // Stop music if playing
    try {
      const audioManager = AudioManager.getInstance();
      audioManager.stopMusic();
    } catch (error) {
      console.error("Error stopping music:", error);
    }
    
    onGameOver(score);
  };
  
  // Handle restart
  const handleRestart = () => {
    setGameState('start');
    setScore(0);
    setLoadedComponents({
      bass: false,
      beatVisualizer: false
    });
  };

  // Update score from window.gameState
  useEffect(() => {
    if (gameState === 'playing' && window.gameState) {
      const scoreUpdateInterval = setInterval(() => {
        if (window.gameState) {
          setScore(window.gameState.score);
        }
      }, 100);
      
      return () => clearInterval(scoreUpdateInterval);
    }
  }, [gameState]);

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
