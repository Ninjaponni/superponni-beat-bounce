
import { useEffect, useRef, useState } from 'react';
import { Beat } from '@/utils/RhythmEngine';

interface BeatVisualizerProps {
  beats: Beat[];
  currentTime: number;
}

const BeatVisualizer = ({ beats, currentTime }: BeatVisualizerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Constants for visualization
  const containerWidth = 600; // px
  const beatWidth = 29; // px
  const outlineWidth = 77; // px
  const visibilityWindow = 2000; // ms
  
  // Calculate beat position based on timing
  const calculateBeatPosition = (beatTime: number) => {
    const timeDiff = beatTime - currentTime;
    // Convert time difference to position
    // Starts from left and moves to right
    const progress = 1 - (timeDiff / visibilityWindow);
    return (containerWidth * progress) - (beatWidth / 2);
  };
  
  // Calculate opacity based on position
  const calculateOpacity = (xPos: number) => {
    // Maximum opacity in the middle, fade in/out on sides
    const center = containerWidth / 2;
    const distance = Math.abs(xPos + beatWidth/2 - center);
    
    if (distance > 200) {
      return Math.max(0, 1 - (distance - 200) / 100);
    }
    return 1;
  };
  
  return (
    <div className="absolute bottom-[150px] left-1/2 transform -translate-x-1/2 h-[100px] w-[600px]">
      {/* Target zone (white outline) */}
      <div 
        className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[77px] h-[77px] border-2 border-white rounded-full"
      />
      
      {/* Beat circles */}
      {beats.map((beat, index) => {
        const xPos = calculateBeatPosition(beat.time);
        const opacity = calculateOpacity(xPos);
        
        // Determine color based on status
        let bgColor = 'bg-white';
        if (beat.score === 'perfect') bgColor = 'bg-[#63AF30]';
        if (beat.score === 'good') bgColor = 'bg-yellow-500';
        if (beat.score === 'miss') bgColor = 'bg-[#E91F1F]';
        
        // Only render visible beats
        if (opacity <= 0) return null;
        
        return (
          <div 
            key={index}
            className={`absolute top-1/2 transform -translate-y-1/2 rounded-full ${bgColor} transition-colors duration-100`}
            style={{
              left: `${xPos}px`,
              width: '29px',
              height: '29px',
              opacity: opacity,
              transform: beat.hit ? 'translate(-50%, -50%) scale(1.3)' : 'translate(-50%, -50%) scale(1)'
            }}
          />
        );
      })}
    </div>
  );
};

export default BeatVisualizer;
