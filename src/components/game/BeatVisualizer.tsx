
import React, { useEffect, useState, useRef } from 'react';
import './BeatVisualizer.css';

interface BeatVisualizerProps {
  beats?: any[];
  currentTime?: number;
}

const BeatVisualizer: React.FC<BeatVisualizerProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
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
      
      // Setup beat generation based on BPM
      const bpm = 130; // Default BPM
      const beatInterval = 60000 / bpm; // ms between beats
      
      // Sørg for at container har riktige dimensjoner
      const containerWidth = window.innerWidth;
      
      // Start generating beats
      setIsActive(true);
      
      // Calculate time to target in ms
      const speed = 250; // pixels per second
      const timeToTargetMs = (containerWidth / 2) / speed * 1000;
      
      console.log(`Beat generation started with interval ${beatInterval.toFixed(0)}ms (${bpm} BPM)`);
      console.log(`Time to target: ${timeToTargetMs.toFixed(0)}ms`);
      
      // Holder styr på aktive beatCircles
      const activeBeats: HTMLElement[] = [];
      
      // Generate beat circles at regular intervals
      const createBeatCircle = () => {
        if (!isActive || !containerRef.current) return;
        
        // Create a beat circle
        const beatCircle = document.createElement('div');
        beatCircle.className = 'beat-circle';
        containerRef.current.appendChild(beatCircle);
        
        // Start position at left
        beatCircle.style.left = '0px';
        
        // Add to active beats
        activeBeats.push(beatCircle);
        
        // Log for debugging
        console.log(`Beat circle created, will reach target in ${timeToTargetMs.toFixed(0)}ms`);
        
        // Animate the beat circle from left to right
        beatCircle.style.animation = 'moveBeat 2s linear forwards';
        
        // Remove beat circle after animation completes
        setTimeout(() => {
          if (beatCircle.parentNode) {
            beatCircle.parentNode.removeChild(beatCircle);
            const index = activeBeats.indexOf(beatCircle);
            if (index !== -1) {
              activeBeats.splice(index, 1);
            }
          }
        }, 2000);
      };
      
      const beatGenerator: NodeJS.Timeout = setInterval(createBeatCircle, beatInterval);
      
      // Create first beat immediately
      createBeatCircle();
      
      // Store reference to beatGenerator in window for debug
      window.beatGenerator = beatGenerator;
      
      // After 8 seconds, hide the instructions
      setTimeout(() => {
        setShowInstructions(false);
      }, 8000);
      
      // Handle player input (space or click)
      const checkHit = () => {
        try {
          if (!containerRef.current) return { hit: false, quality: 'miss' };
          
          // Get all active beat circles
          if (activeBeats.length === 0) return { hit: false, quality: 'miss' };
          
          // Get target zone position
          const targetRect = targetZone.getBoundingClientRect();
          const targetCenterX = targetRect.left + targetRect.width / 2;
          
          // Find closest beat to target
          let closestBeat = null;
          let closestDistance = Infinity;
          
          activeBeats.forEach(beat => {
            const beatRect = beat.getBoundingClientRect();
            const beatCenterX = beatRect.left + beatRect.width / 2;
            const distance = Math.abs(beatCenterX - targetCenterX);
            
            if (distance < closestDistance) {
              closestDistance = distance;
              closestBeat = beat;
            }
          });
          
          // Determine hit quality based on distance
          if (closestBeat && closestDistance < 100) {
            // Get precise quality
            let quality = 'miss';
            let hitText = '';
            
            if (closestDistance < 20) {
              quality = 'perfect';
              hitText = 'PERFECT!';
              closestBeat.classList.add('hit-perfect');
              
              // Visual feedback on target zone
              targetZone.classList.add('target-hit-perfect');
              setTimeout(() => targetZone.classList.remove('target-hit-perfect'), 200);
            } else if (closestDistance < 50) {
              quality = 'good';
              hitText = 'GOOD!';
              closestBeat.classList.add('hit-good');
              
              targetZone.classList.add('target-hit-good');
              setTimeout(() => targetZone.classList.remove('target-hit-good'), 200);
            } else {
              quality = 'ok';
              hitText = 'OK';
              closestBeat.classList.add('hit-ok');
              
              targetZone.classList.add('target-hit-ok');
              setTimeout(() => targetZone.classList.remove('target-hit-ok'), 200);
            }
            
            // Display hit text
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
            
            console.log(`Hit: ${quality}, distance: ${closestDistance.toFixed(2)}px`);
            return { hit: true, quality };
          }
          
          // Miss
          if (window.gameState) {
            window.gameState.combo = 0;
            
            // Update UI
            const comboElement = document.querySelector('.combo');
            if (comboElement) {
              comboElement.textContent = `Combo: 0`;
            }
          }
          
          return { hit: false, quality: 'miss' };
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
        clearInterval(beatGenerator);
        delete window.beatGenerator;
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
