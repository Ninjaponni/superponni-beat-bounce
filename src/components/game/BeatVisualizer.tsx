
import React, { useEffect, useState, useRef } from 'react';
import './BeatVisualizer.css';
import AudioManager from '@/utils/AudioManager';
import RhythmEngine from '@/utils/RhythmEngine';
import { toast } from 'sonner';

interface BeatVisualizerProps {
  beats?: any[];
  currentTime?: number;
}

const BeatVisualizer: React.FC<BeatVisualizerProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [audioManager, setAudioManager] = useState<AudioManager | null>(null);
  const [rhythmEngine, setRhythmEngine] = useState<RhythmEngine | null>(null);
  
  useEffect(() => {
    console.log("BeatVisualizer mounting");
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
      // Create container for beat circles if it doesn't exist
      if (!containerRef.current) {
        console.warn("BeatVisualizer container not available");
        return;
      }
      
      // Get BPM info
      const { bpm, interval: beatInterval } = audio.getBeatInfo();
      console.log(`Using BPM: ${bpm}, interval: ${beatInterval}ms`);
      
      // Initialize rhythm engine with the correct BPM
      engine.reset();
      engine.start(performance.now());
      
      // Create beat track (the line)
      const track = document.createElement('div');
      track.className = 'beat-track';
      containerRef.current.appendChild(track);
      
      // Add target zone (the fixed circle)
      const targetZone = document.createElement('div');
      targetZone.className = 'target-zone';
      containerRef.current.appendChild(targetZone);
      
      // Calculate container dimensions
      const containerWidth = window.innerWidth;
      
      // Calculate speed and timing based on BPM
      const speed = 250; // pixels per second - this should be calculated based on screen size
      const timeToTargetMs = (containerWidth / 2) / speed * 1000;
      
      // Set CSS variables for animation duration
      document.documentElement.style.setProperty('--beat-duration', `${timeToTargetMs}ms`);
      
      console.log(`Beat generation started with interval ${beatInterval.toFixed(0)}ms (${bpm} BPM)`);
      console.log(`Time to target: ${timeToTargetMs.toFixed(0)}ms`);
      
      // Start generating beats
      setIsActive(true);
      
      // Track active beat circles
      const activeBeats: HTMLElement[] = [];
      
      // Generate beat circles function
      const createBeatCircle = () => {
        if (!isActive || !containerRef.current) return;
        
        // Create a beat circle
        const beatCircle = document.createElement('div');
        beatCircle.className = 'beat-circle beat-circle-dynamic'; // Add dynamic class
        containerRef.current.appendChild(beatCircle);
        
        // Add to active beats
        activeBeats.push(beatCircle);
        
        // Log for debugging
        console.log(`Beat circle created, will reach target in ${timeToTargetMs.toFixed(0)}ms`);
        
        // Remove beat circle after animation completes
        setTimeout(() => {
          if (beatCircle.parentNode) {
            beatCircle.parentNode.removeChild(beatCircle);
            const index = activeBeats.indexOf(beatCircle);
            if (index !== -1) {
              activeBeats.splice(index, 1);
            }
          }
        }, timeToTargetMs);
      };
      
      // Register with AudioManager to create beat circles in sync with music
      const beatCallback = (time: number) => {
        createBeatCircle();
      };
      
      // Register beat callback with AudioManager
      audio.onBeat(beatCallback);
      
      // Create first beat immediately for visual reference
      createBeatCircle();
      
      // After 8 seconds, hide the instructions
      setTimeout(() => {
        setShowInstructions(false);
      }, 8000);
      
      // Improved hit detection using RhythmEngine
      const checkHit = () => {
        try {
          if (!containerRef.current) return { hit: false, quality: 'miss' };
          
          // Get current time from AudioManager
          const currentTime = audio.getCurrentTime() * 1000;
          
          // Use RhythmEngine for precise hit detection
          const result = engine.checkPlayerInput(currentTime);
          
          // Process hit result
          if (result.hit) {
            // Find the closest visual beat for visual feedback
            let closestBeat = null;
            let closestDistance = Infinity;
            
            if (activeBeats.length > 0) {
              // Get target zone position
              const targetRect = targetZone.getBoundingClientRect();
              const targetCenterX = targetRect.left + targetRect.width / 2;
              
              activeBeats.forEach(beat => {
                const beatRect = beat.getBoundingClientRect();
                const beatCenterX = beatRect.left + beatRect.width / 2;
                const distance = Math.abs(beatCenterX - targetCenterX);
                
                if (distance < closestDistance) {
                  closestDistance = distance;
                  closestBeat = beat;
                }
              });
            }
            
            // Quality mapping
            const quality = result.score;
            let hitText = '';
            
            // Apply visual feedback based on hit quality
            if (quality === 'perfect') {
              hitText = 'PERFECT!';
              if (closestBeat) closestBeat.classList.add('hit-perfect');
              targetZone.classList.add('target-hit-perfect');
              setTimeout(() => targetZone.classList.remove('target-hit-perfect'), 200);
            } else if (quality === 'good') {
              hitText = 'GOOD!';
              if (closestBeat) closestBeat.classList.add('hit-good');
              targetZone.classList.add('target-hit-good');
              setTimeout(() => targetZone.classList.remove('target-hit-good'), 200);
            } else {
              // 'ok' quality
              hitText = 'OK';
              if (closestBeat) closestBeat.classList.add('hit-ok');
              targetZone.classList.add('target-hit-ok');
              setTimeout(() => targetZone.classList.remove('target-hit-ok'), 200);
            }
            
            // Play hit sound
            audio.playHitSound(quality);
            
            // Display hit text if we have a visual beat
            if (closestBeat && containerRef.current) {
              const hitTextEl = document.createElement('div');
              hitTextEl.className = `hit-text ${quality}`;
              hitTextEl.textContent = hitText;
              hitTextEl.style.left = closestBeat.style.left;
              containerRef.current.appendChild(hitTextEl);
              
              // Remove hit text after animation
              setTimeout(() => {
                if (hitTextEl.parentNode) {
                  hitTextEl.parentNode.removeChild(hitTextEl);
                }
              }, 1000);
              
              // Remove the beat circle
              setTimeout(() => {
                if (closestBeat && closestBeat.parentNode) {
                  closestBeat.parentNode.removeChild(closestBeat);
                  const index = activeBeats.indexOf(closestBeat);
                  if (index !== -1) {
                    activeBeats.splice(index, 1);
                  }
                }
              }, 100);
            }
            
            // Trigger hit on bass controller if available
            if (window.bassController && typeof window.bassController.handleHit === 'function') {
              window.bassController.handleHit(quality);
            } else if (window.gameBass) {
              // Simple animation if no controller
              const force = quality === 'perfect' ? 5 : 
                        quality === 'good' ? 3 : 1.5;
              
              window.gameBass.position.y += force * 0.1;
              console.log(`Bass hit with quality: ${quality}, force: ${force}`);
            }
            
            // Update score
            if (window.gameState) {
              const points = quality === 'perfect' ? 100 : 
                            quality === 'good' ? 50 : 10;
              
              window.gameState.score = (window.gameState.score || 0) + points;
              window.gameState.combo = (window.gameState.combo || 0) + 1;
              
              // Update UI if it exists
              const scoreElement = document.querySelector('.score');
              if (scoreElement) {
                scoreElement.textContent = `Score: ${window.gameState.score}`;
              }
              
              const comboElement = document.querySelector('.combo');
              if (comboElement) {
                comboElement.textContent = `Combo: ${window.gameState.combo}`;
              }
            }
            
            console.log(`Hit: ${quality}, beat index: ${result.beatIndex}`);
            return { hit: true, quality };
          } else {
            // Miss
            if (window.gameState) {
              window.gameState.combo = 0;
              audio.playSound('miss', 0.6);
              
              // Update UI
              const comboElement = document.querySelector('.combo');
              if (comboElement) {
                comboElement.textContent = `Combo: 0`;
              }
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
        
        delete window.checkHit;
        
        // Remove all active beats
        activeBeats.forEach(beat => {
          if (beat.parentNode) {
            beat.parentNode.removeChild(beat);
          }
        });
        
        // Remove track and target zone
        if (track.parentNode) track.parentNode.removeChild(track);
        if (targetZone.parentNode) targetZone.parentNode.removeChild(targetZone);
      };
    } catch (error) {
      console.error("Error in BeatVisualizer:", error);
      toast.error("Problem med visualisering av bass-rytme");
    }
  }, []);
  
  // Handle player input (space or click)
  const checkHit = () => {
    if (typeof window.checkHit === 'function') {
      window.checkHit();
    }
  };
  
  return (
    <div 
      ref={containerRef}
      className="beat-visualizer"
      onClick={checkHit}
    >
      {showInstructions && (
        <div className="instruction-box">
          <h3>Slik spiller du:</h3>
          <p>Trykk på <strong>mellomrom</strong> når de hvite sirklene er i midten av ringen</p>
          <p>Perfekt timing gir høyest poeng!</p>
        </div>
      )}
      <div className="instruction-text">Trykk på mellomrom når sirkelen er i midten</div>
    </div>
  );
};

export default BeatVisualizer;
