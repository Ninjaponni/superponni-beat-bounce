
import React, { useEffect, useState, useRef } from 'react';
import './BeatVisualizer.css';
import useBeatVisualizer from '@/hooks/useBeatVisualizer';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";

// Create a static variable to track mount/unmount cycles and prevent duplicate initialization
let mountCounter = 0;

// Define consistent types for timing feedback
export type TimingFeedback = 'EARLY' | 'PERFECT' | 'LATE' | null;
const TIMING_DISPLAY: Record<string, string> = {
  'EARLY': 'FOR TIDLIG',
  'PERFECT': 'PERFEKT',
  'LATE': 'FOR SENT'
};

const BeatVisualizer: React.FC = () => {
  const { containerRef, isActive, audioManager } = useBeatVisualizer();
  const [showInstructions, setShowInstructions] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(1);
  const [initialized, setInitialized] = useState(false);
  const activeBeatsRef = useRef<HTMLElement[]>([]);
  const instanceId = useRef(++mountCounter);
  
  console.log(`BeatVisualizer mounting - instance ${instanceId.current}, initialized: ${initialized}`);
  
  useEffect(() => {
    // Only initialize once
    if (initialized) {
      console.log(`BeatVisualizer instance ${instanceId.current} already initialized, skipping setup`);
      return;
    }
    
    try {
      console.log(`BeatVisualizer instance ${instanceId.current} initializing`);
      
      // Create container for beat circles if it doesn't exist
      if (!containerRef.current) {
        console.warn("BeatVisualizer container not available");
        return;
      }
      
      // Clean up any previous elements
      console.log("Cleaning up any previous elements");
      Array.from(containerRef.current.children).forEach((child) => {
        if (child instanceof HTMLElement && 
            (child.classList.contains('beat-track') || 
             child.classList.contains('target-zone') || 
             child.classList.contains('timing-feedback') || 
             child.classList.contains('combo-counter') ||
             child.classList.contains('beat-circle') ||
             child.classList.contains('instruction-box') ||
             child.classList.contains('instruction-text'))) {
          containerRef.current?.removeChild(child);
        }
      });
      
      // Create beat track (the line)
      const track = document.createElement('div');
      track.className = 'beat-track';
      containerRef.current.appendChild(track);
      
      // Add target zone (the fixed circle)
      const targetZone = document.createElement('div');
      targetZone.className = 'target-zone';
      containerRef.current.appendChild(targetZone);
      
      // Add timing feedback element
      const timingFeedback = document.createElement('div');
      timingFeedback.className = 'timing-feedback';
      containerRef.current.appendChild(timingFeedback);
      
      // Add combo counter
      const comboCounter = document.createElement('div');
      comboCounter.className = 'combo-counter';
      comboCounter.innerHTML = '<div class="combo-number">0</div><div class="combo-text">COMBO</div>';
      containerRef.current.appendChild(comboCounter);
      
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
      
      // Generate beat circles function
      const createBeatCircle = () => {
        console.log("Creating beat circle");
        if (!isActive || !containerRef.current) {
          console.log("Skipping beat creation - not active or container missing");
          return;
        }
        
        // Create a beat circle
        const beatCircle = document.createElement('div');
        beatCircle.className = 'beat-circle beat-circle-dynamic'; // Add dynamic class
        containerRef.current.appendChild(beatCircle);
        
        // Add to active beats
        activeBeatsRef.current.push(beatCircle);
        console.log(`Active beats: ${activeBeatsRef.current.length}`);
        
        // Remove beat circle after animation completes
        setTimeout(() => {
          if (beatCircle.parentNode) {
            beatCircle.parentNode.removeChild(beatCircle);
            const index = activeBeatsRef.current.indexOf(beatCircle);
            if (index !== -1) {
              activeBeatsRef.current.splice(index, 1);
            }
          }
        }, timeToTargetMs + 500); // Added buffer time
      };
      
      // Register with AudioManager to create beat circles in sync with music
      const beatCallback = () => {
        console.log("Beat callback triggered");
        createBeatCircle();
      };
      
      // Register beat callback with AudioManager
      audioManager.onBeat(beatCallback);
      
      // Create first beat immediately for visual reference
      setTimeout(() => {
        createBeatCircle();
      }, 200);
      
      // Update timing feedback periodically
      const feedbackInterval = setInterval(() => {
        if (window.gameState && window.gameState.timingFeedback && timingFeedback) {
          let timingClass = '';
          
          if (window.gameState.timingFeedback === 'EARLY') {
            timingClass = 'timing-early';
          } else if (window.gameState.timingFeedback === 'PERFECT') {
            timingClass = 'timing-perfect';
          } else if (window.gameState.timingFeedback === 'LATE') {
            timingClass = 'timing-late';
          }
          
          // Display the Norwegian translation of the timing feedback
          timingFeedback.textContent = TIMING_DISPLAY[window.gameState.timingFeedback] || '';
          timingFeedback.className = 'timing-feedback ' + timingClass;
          
          // Clear timing feedback after 1 second
          window.gameState.timingFeedback = null;
        }
      }, 100);
      
      // After 8 seconds, hide the instructions
      setTimeout(() => {
        setShowInstructions(false);
      }, 8000);
      
      // Event listener for hit visual feedback
      const handleHitEvent = (event: CustomEvent) => {
        console.log("Hit event received:", event.detail);
        const { quality, targetElement, timing } = event.detail;
        
        if (!quality || !targetElement) return;
        
        // Find closest visual beat
        let closestBeat = null;
        let closestDistance = Infinity;
        
        if (activeBeatsRef.current.length > 0) {
          // Get target zone position
          const targetRect = targetZone.getBoundingClientRect();
          const targetCenterX = targetRect.left + targetRect.width / 2;
          
          activeBeatsRef.current.forEach(beat => {
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
        
        // Update timing feedback
        if (timing && timingFeedback) {
          let timingClass = '';
          let timingText = '';
          
          if (timing === 'early') {
            timingClass = 'timing-early';
            timingText = 'FOR TIDLIG';
          } else if (timing === 'perfect') {
            timingClass = 'timing-perfect';
            timingText = 'PERFEKT';
          } else if (timing === 'late') {
            timingClass = 'timing-late';
            timingText = 'FOR SENT';
          }
          
          timingFeedback.textContent = timingText;
          timingFeedback.className = 'timing-feedback ' + timingClass;
          
          // Hide timing feedback after 1 second
          setTimeout(() => {
            if (timingFeedback.parentNode) {
              timingFeedback.textContent = '';
            }
          }, 1000);
        }
        
        // Update combo counter
        if (window.gameState && comboCounter) {
          const comboNumberEl = comboCounter.querySelector('.combo-number');
          if (comboNumberEl) {
            comboNumberEl.textContent = window.gameState.combo.toString();
          }
          
          // Add animation for milestone combos
          if (window.gameState.combo > 0 && window.gameState.combo % 10 === 0) {
            comboCounter.classList.add('combo-milestone');
            setTimeout(() => comboCounter.classList.remove('combo-milestone'), 500);
          }
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
              const index = activeBeatsRef.current.indexOf(closestBeat);
              if (index !== -1) {
                activeBeatsRef.current.splice(index, 1);
              }
            }
          }, 100);
        }
      };
      
      // Event listener for perfect milestone
      const handlePerfectMilestone = (event: CustomEvent) => {
        const { count } = event.detail;
        
        if (!containerRef.current) return;
        
        // Create milestone text
        const milestoneEl = document.createElement('div');
        milestoneEl.className = 'perfect-milestone';
        milestoneEl.textContent = `${count} PERFEKTE TREFF! +500`;
        containerRef.current.appendChild(milestoneEl);
        
        // Remove after animation
        setTimeout(() => {
          if (milestoneEl.parentNode) {
            milestoneEl.parentNode.removeChild(milestoneEl);
          }
        }, 2000);
      };
      
      // Register for hit events
      window.addEventListener('game:hit', handleHitEvent as EventListener);
      window.addEventListener('game:perfectMilestone', handlePerfectMilestone as EventListener);
      
      // Mark as initialized
      setInitialized(true);
      
      // Add an instruction text element
      const instructionText = document.createElement('div');
      instructionText.className = 'instruction-text';
      instructionText.textContent = 'Trykk på mellomrom når sirkelen er i midten';
      containerRef.current.appendChild(instructionText);
      
      // Clean up
      return () => {
        console.log(`BeatVisualizer instance ${instanceId.current} cleaning up`);
        
        // Clear interval
        clearInterval(feedbackInterval);
        
        // Remove event listeners
        window.removeEventListener('game:hit', handleHitEvent as EventListener);
        window.removeEventListener('game:perfectMilestone', handlePerfectMilestone as EventListener);
        
        // Remove beat callback from AudioManager
        if (audioManager) {
          audioManager.offBeat(beatCallback);
        }
        
        // Remove all active beats
        activeBeatsRef.current.forEach(beat => {
          if (beat.parentNode) {
            beat.parentNode.removeChild(beat);
          }
        });
        activeBeatsRef.current = [];
      };
    } catch (error) {
      console.error("Error in BeatVisualizer:", error);
      toast.error("Problem med visualisering av bass-rytme");
    }
  }, [containerRef, isActive, audioManager, initialized]);
  
  // Handle tutorial steps
  const handleShowTutorial = () => {
    setShowTutorial(true);
    setTutorialStep(1);
  };
  
  const handleNextTutorialStep = () => {
    if (tutorialStep < 3) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
    }
  };
  
  const renderTutorial = () => {
    if (!showTutorial) return null;
    
    return (
      <div className="tutorial-overlay">
        {tutorialStep === 1 && (
          <div className="tutorial-step">
            <h3>Trykk på riktig timing</h3>
            <p>De hvite sirklene beveger seg fra venstre til høyre. Trykk på <strong>mellomrom</strong> eller <strong>klikk</strong> 
               akkurat når sirkelen er i midten av målsonen for å få perfekt treff.</p>
            <Button className="tutorial-continue" onClick={handleNextTutorialStep}>Neste</Button>
          </div>
        )}
        {tutorialStep === 2 && (
          <div className="tutorial-step">
            <h3>Poeng og combos</h3>
            <p>Du får poeng basert på hvor presist du treffer:
               <br /><strong>PERFECT</strong> gir mest poeng
               <br /><strong>GOOD</strong> gir middels poeng
               <br /><strong>OK</strong> gir færre poeng
               <br />Combos øker poengsummen din! Hold en streak av treff for å få høyere combo-multiplier.</p>
            <Button className="tutorial-continue" onClick={handleNextTutorialStep}>Neste</Button>
          </div>
        )}
        {tutorialStep === 3 && (
          <div className="tutorial-step">
            <h3>Bonuser og milepæler</h3>
            <p>Få ekstra poeng for hver 10. perfekte treff.
               <br />Jo høyere combo, jo høyere blir poengsummen din.
               <br />Bruk timing-feedbacken (FOR TIDLIG / PERFEKT / FOR SENT) til å forbedre deg.</p>
            <Button className="tutorial-continue" onClick={handleNextTutorialStep}>Begynn å spille!</Button>
          </div>
        )}
      </div>
    );
  };
  
  // Handle player input
  const checkHit = () => {
    console.log("checkHit called from BeatVisualizer click");
    if (typeof window.checkHit === 'function') {
      const result = window.checkHit();
      console.log("checkHit result:", result);
      
      // Dispatch event for visual feedback
      if (result && result.hit) {
        const event = new CustomEvent('game:hit', { 
          detail: { 
            quality: result.quality,
            timing: result.timing,
            targetElement: containerRef.current
          } 
        });
        window.dispatchEvent(event);
      }
    } else {
      console.warn("window.checkHit is not a function");
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
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleShowTutorial}
          >
            Vis tutorial
          </Button>
        </div>
      )}
      {renderTutorial()}
    </div>
  );
};

export default BeatVisualizer;
