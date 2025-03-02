
import React, { useEffect, useState } from 'react';
import './BeatVisualizer.css';
import useBeatVisualizer from '@/hooks/useBeatVisualizer';
import { toast } from 'sonner';

const BeatVisualizer: React.FC = () => {
  const { containerRef, isActive, audioManager } = useBeatVisualizer();
  const [showInstructions, setShowInstructions] = useState(true);
  
  useEffect(() => {
    console.log("BeatVisualizer mounting");
    
    try {
      // Create container for beat circles if it doesn't exist
      if (!containerRef.current) {
        console.warn("BeatVisualizer container not available");
        return;
      }
      
      // Create beat track (the line)
      const track = document.createElement('div');
      track.className = 'beat-track';
      containerRef.current.appendChild(track);
      
      // Add target zone (the fixed circle)
      const targetZone = document.createElement('div');
      targetZone.className = 'target-zone';
      containerRef.current.appendChild(targetZone);
      
      // Get BPM info and audio manager
      if (!audioManager) {
        toast.error("Lydmotor ikke tilgjengelig");
        return;
      }
      
      const { bpm, interval: beatInterval } = audioManager.getBeatInfo();
      
      // Calculate container dimensions
      const containerWidth = window.innerWidth;
      
      // Calculate speed and timing based on BPM
      const speed = 250; // pixels per second - this should be calculated based on screen size
      const timeToTargetMs = (containerWidth / 2) / speed * 1000;
      
      // Set CSS variables for animation duration
      document.documentElement.style.setProperty('--beat-duration', `${timeToTargetMs}ms`);
      
      console.log(`Beat generation started with interval ${beatInterval.toFixed(0)}ms (${bpm} BPM)`);
      console.log(`Time to target: ${timeToTargetMs.toFixed(0)}ms`);
      
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
      const beatCallback = () => {
        createBeatCircle();
      };
      
      // Register beat callback with AudioManager
      audioManager.onBeat(beatCallback);
      
      // Create first beat immediately for visual reference
      createBeatCircle();
      
      // After 8 seconds, hide the instructions
      setTimeout(() => {
        setShowInstructions(false);
      }, 8000);
      
      // Event listener for hit visual feedback
      const handleHitEvent = (event: CustomEvent) => {
        const { quality, targetElement } = event.detail;
        
        if (!quality || !targetElement) return;
        
        // Find closest visual beat
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
        
        // Apply visual feedback based on hit quality
        let hitText = '';
        
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
        } else if (quality === 'ok') {
          hitText = 'OK';
          if (closestBeat) closestBeat.classList.add('hit-ok');
          targetZone.classList.add('target-hit-ok');
          setTimeout(() => targetZone.classList.remove('target-hit-ok'), 200);
        }
        
        // Display hit text if we have a visual beat
        if (closestBeat && containerRef.current && hitText) {
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
      };
      
      // Register for hit events
      window.addEventListener('game:hit', handleHitEvent as EventListener);
      
      // Clean up
      return () => {
        // Remove event listener
        window.removeEventListener('game:hit', handleHitEvent as EventListener);
        
        // Remove beat callback from AudioManager
        if (audioManager) {
          audioManager.offBeat(beatCallback);
        }
        
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
  }, [containerRef, isActive, audioManager]);
  
  // Handle player input
  const checkHit = () => {
    if (typeof window.checkHit === 'function') {
      const result = window.checkHit();
      
      // Dispatch event for visual feedback
      if (result.hit) {
        const event = new CustomEvent('game:hit', { 
          detail: { 
            quality: result.quality,
            targetElement: containerRef.current
          } 
        });
        window.dispatchEvent(event);
      }
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
