
import { useEffect, useRef, useState } from 'react';
import AudioManager from '@/utils/AudioManager';
import RhythmEngine from '@/utils/RhythmEngine';

type HitQuality = 'perfect' | 'good' | 'ok' | 'miss';

interface HitResult {
  hit: boolean;
  quality: HitQuality;
}

export function useBeatVisualizer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [audioManager, setAudioManager] = useState<AudioManager | null>(null);
  const [rhythmEngine, setRhythmEngine] = useState<RhythmEngine | null>(null);
  
  useEffect(() => {
    console.log("BeatVisualizer hook initializing");
    const audio = AudioManager.getInstance();
    setAudioManager(audio);
    
    // Create or get RhythmEngine
    let engine: RhythmEngine;
    if (window.rhythmEngine) {
      engine = window.rhythmEngine;
      console.log("Using existing RhythmEngine instance");
    } else {
      engine = new RhythmEngine();
      window.rhythmEngine = engine;
      console.log("Created new RhythmEngine instance");
    }
    setRhythmEngine(engine);
    
    try {
      // Get BPM info
      const { bpm, interval: beatInterval } = audio.getBeatInfo();
      console.log(`Using BPM: ${bpm}, interval: ${beatInterval}ms`);
      
      // Initialize rhythm engine with the correct BPM
      engine.reset();
      engine.start(performance.now());
      
      // Start generating beats
      setIsActive(true);
      
      // Register with AudioManager to create beat circles in sync with music
      const beatCallback = (time: number) => {
        // This will be handled in the component
      };
      
      // Register beat callback with AudioManager
      audio.onBeat(beatCallback);
      
      // Improved hit detection using RhythmEngine
      const checkHit = (): HitResult => {
        try {
          if (!containerRef.current) return { hit: false, quality: 'miss' };
          
          // Get current time from AudioManager
          const currentTime = audio.getCurrentTime() * 1000;
          
          // Use RhythmEngine for precise hit detection
          const result = engine.checkPlayerInput(currentTime);
          
          // Process hit result
          if (result.hit) {
            // Quality mapping
            const quality = result.score as HitQuality;
            
            // Update score
            if (window.gameState) {
              const points = quality === 'perfect' ? 100 : 
                            quality === 'good' ? 50 : 10;
              
              window.gameState.score = (window.gameState.score || 0) + points;
              window.gameState.combo = (window.gameState.combo || 0) + 1;
            }
            
            // Play hit sound
            audio.playHitSound(quality);
            
            console.log(`Hit: ${quality}, beat index: ${result.beatIndex}`);
            return { hit: true, quality };
          } else {
            // Miss
            if (window.gameState) {
              window.gameState.combo = 0;
              audio.playSound('miss', 0.6);
            }
            
            return { hit: false, quality: 'miss' };
          }
        } catch (error) {
          console.error("Error checking hit:", error);
          return { hit: false, quality: 'miss' };
        }
      };
      
      // Add global access to checkHit
      window.checkHit = checkHit;
      
      // Clean up
      return () => {
        setIsActive(false);
        
        // Remove beat callback from AudioManager
        if (audio) {
          audio.offBeat(beatCallback);
        }
        
        // Remove global reference to checkHit
        if (window.checkHit === checkHit) {
          delete window.checkHit;
        }
      };
    } catch (error) {
      console.error("Error in BeatVisualizer hook:", error);
      return;
    }
  }, []);
  
  return {
    containerRef,
    isActive,
    audioManager,
    rhythmEngine
  };
}

export default useBeatVisualizer;
