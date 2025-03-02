
import { useEffect, useRef, useState } from 'react';
import AudioManager from '@/utils/AudioManager';
import RhythmEngine from '@/utils/RhythmEngine';

type HitQuality = 'perfect' | 'good' | 'ok' | 'miss';

interface HitResult {
  hit: boolean;
  quality: HitQuality;
  timing?: 'early' | 'perfect' | 'late';
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
        console.log(`Beat callback from useBeatVisualizer at ${time}ms`);
        // This will be handled in the component
      };
      
      // Register beat callback with AudioManager
      audio.onBeat(beatCallback);
      
      // Improved hit detection using RhythmEngine with combo system
      const checkHit = (): HitResult => {
        console.log("checkHit function called from global access");
        try {
          if (!containerRef.current) {
            console.warn("No container ref in checkHit");
            return { hit: false, quality: 'miss' };
          }
          
          // Get current time from AudioManager
          const currentTime = audio.getCurrentTime() * 1000;
          
          // Use RhythmEngine for precise hit detection
          console.log(`Checking hit at ${currentTime}ms`);
          const result = engine.checkPlayerInput(currentTime);
          
          // Process hit result
          if (result.hit) {
            // Quality mapping
            const quality = result.score as HitQuality;
            
            // Update score and combo with enhanced system
            if (window.gameState) {
              // Base points based on quality
              let basePoints = quality === 'perfect' ? 100 : 
                              quality === 'good' ? 50 : 10;
              
              // Apply combo multiplier (combo starts at 0, so add 1 for calculation)
              const comboMultiplier = 1 + Math.min(window.gameState.combo * 0.1, 3); // Cap at 4x
              
              // Calculate final points
              const points = Math.floor(basePoints * comboMultiplier);
              
              // Track perfect hits for bonus milestones
              if (quality === 'perfect') {
                window.gameState.perfectCount = (window.gameState.perfectCount || 0) + 1;
                
                // Every 10 perfect hits gives bonus points
                if (window.gameState.perfectCount % 10 === 0) {
                  window.gameState.score += 500; // Bonus for consistency!
                  
                  // Show a special effect for perfect hit milestone
                  const event = new CustomEvent('game:perfectMilestone', { 
                    detail: { 
                      count: window.gameState.perfectCount 
                    } 
                  });
                  window.dispatchEvent(event);
                }
              }
              
              // Update score and combo
              window.gameState.score = (window.gameState.score || 0) + points;
              window.gameState.combo = (window.gameState.combo || 0) + 1;
              
              // Track max combo
              if (!window.gameState.maxCombo || window.gameState.combo > window.gameState.maxCombo) {
                window.gameState.maxCombo = window.gameState.combo;
              }
              
              // Set timing feedback
              window.gameState.timingFeedback = result.timing === 'early' ? 'EARLY' : 
                                                result.timing === 'late' ? 'LATE' : 'PERFECT';
            }
            
            // Play hit sound
            audio.playHitSound(quality);
            
            // Trigger bass animation via bassController
            if (window.bassController) {
              window.bassController.handleHit(quality);
            }
            
            console.log(`Hit: ${quality}, beat index: ${result.beatIndex}, timing: ${result.timing}`);
            return { hit: true, quality, timing: result.timing };
          } else {
            // Miss
            if (window.gameState) {
              window.gameState.combo = 0;
              window.gameState.timingFeedback = null;
              audio.playSound('miss', 0.6);
            }
            
            console.log("Miss: No beat found within the timing window");
            return { hit: false, quality: 'miss' };
          }
        } catch (error) {
          console.error("Error checking hit:", error);
          return { hit: false, quality: 'miss' };
        }
      };
      
      // Add global access to checkHit
      window.checkHit = checkHit;
      console.log("Registered window.checkHit function");
      
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
