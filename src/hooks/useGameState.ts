
import { useState, useEffect, useCallback } from 'react';
import AudioManager from '@/utils/AudioManager';
import { toast } from "sonner";

export type GameStateType = 'start' | 'countdown' | 'playing' | 'gameover';

interface UseGameStateProps {
  onGameOver?: (score: number, perfectHits?: number, maxCombo?: number) => void;
}

export function useGameState({ onGameOver }: UseGameStateProps = {}) {
  const [gameState, setGameState] = useState<GameStateType>('start');
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [score, setScore] = useState(0);
  const [loadedComponents, setLoadedComponents] = useState({
    bass: false,
    beatVisualizer: false
  });
  const [showInstructions, setShowInstructions] = useState(true);
  
  // Initialize audio when hook mounts
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
        toast.error("Kunne ikke initialisere lyd");
      }
    };
    
    // Initialize debug logs if not already done
    if (!window._debugLogs) {
      window._debugLogs = [];
    }
    
    initAudio();
  }, []);
  
  // Start game function
  const startGame = useCallback(() => {
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
  }, []);
  
  // Handle countdown completion
  const handleCountdownComplete = useCallback(() => {
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
      
      // Create global config with 'bass' property
      window.gameConfig = {
        physics: {
          bass: {
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
            toast.error("Kunne ikke starte musikken");
          }
        }, 500);
      }, 500);
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Feil ved oppstart av spillet");
      // Continue to playing state even if there's an error
      setGameState('playing');
    }
  }, []);
  
  // Handle game over
  const handleGameOver = useCallback(() => {
    setGameState('gameover');
    
    // Stop music if playing
    try {
      const audioManager = AudioManager.getInstance();
      audioManager.stopMusic();
    } catch (error) {
      console.error("Error stopping music:", error);
    }
    
    if (onGameOver && window.gameState) {
      onGameOver(window.gameState.score);
    }
  }, [onGameOver]);
  
  // Handle restart
  const handleRestart = useCallback(() => {
    setGameState('start');
    setScore(0);
    setLoadedComponents({
      bass: false,
      beatVisualizer: false
    });
  }, []);

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

  return {
    gameState,
    setGameState,
    countdownNumber,
    score,
    loadedComponents,
    showInstructions,
    startGame,
    handleGameOver,
    handleRestart
  };
}

export default useGameState;
