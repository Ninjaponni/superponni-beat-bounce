
import React, { useEffect, useState, useRef } from 'react';
import './BeatVisualizer.css';

const BeatVisualizer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    console.log("BeatVisualizer mounting");
    
    try {
      // Create container for beat circles if it doesn't exist
      if (!containerRef.current) {
        console.warn("BeatVisualizer container not available");
        return;
      }
      
      // Add target zone (the fixed circle)
      const targetZone = document.createElement('div');
      targetZone.className = 'target-zone';
      containerRef.current.appendChild(targetZone);
      
      // Setup beat generation based on BPM
      const bpm = 130; // Default BPM
      const beatInterval = 60000 / bpm; // ms between beats
      
      // Start generating beats
      setIsActive(true);
      
      // Generate beat circles at regular intervals
      const beatGenerator = setInterval(() => {
        if (!isActive || !containerRef.current) return;
        
        // Create a beat circle
        const beatCircle = document.createElement('div');
        beatCircle.className = 'beat-circle';
        containerRef.current.appendChild(beatCircle);
        
        // Animate the beat circle from left to right
        beatCircle.style.animation = 'moveBeat 2s linear forwards';
        
        // Remove beat circle after animation completes
        setTimeout(() => {
          if (beatCircle.parentNode) {
            beatCircle.parentNode.removeChild(beatCircle);
          }
        }, 2000);
      }, beatInterval);
      
      // Store reference to beatGenerator in window for debug
      window.beatGenerator = beatGenerator;
      
      // Clean up
      return () => {
        setIsActive(false);
        clearInterval(beatGenerator);
        delete window.beatGenerator;
      };
    } catch (error) {
      console.error("Error in BeatVisualizer:", error);
    }
  }, []);
  
  // Handle player input (space or click)
  const checkHit = () => {
    try {
      if (!containerRef.current) return { hit: false, quality: 'miss' };
      
      // Get all active beat circles
      const beatCircles = containerRef.current.querySelectorAll('.beat-circle');
      if (beatCircles.length === 0) return { hit: false, quality: 'miss' };
      
      // Get target zone position
      const targetZone = containerRef.current.querySelector('.target-zone');
      if (!targetZone) return { hit: false, quality: 'miss' };
      
      const targetRect = targetZone.getBoundingClientRect();
      const targetCenterX = targetRect.left + targetRect.width / 2;
      
      // Find closest beat to target
      let closestBeat = null;
      let closestDistance = Infinity;
      
      beatCircles.forEach(beat => {
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
        
        if (closestDistance < 20) {
          quality = 'perfect';
          closestBeat.classList.add('hit-perfect');
        } else if (closestDistance < 50) {
          quality = 'good';
          closestBeat.classList.add('hit-good');
        } else {
          quality = 'ok';
          closestBeat.classList.add('hit-ok');
        }
        
        // Remove the beat circle
        setTimeout(() => {
          if (closestBeat && closestBeat.parentNode) {
            closestBeat.parentNode.removeChild(closestBeat);
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
  useEffect(() => {
    window.checkHit = checkHit;
    
    return () => {
      delete window.checkHit;
    };
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className="beat-visualizer"
      onClick={checkHit}
    ></div>
  );
};

export default BeatVisualizer;
